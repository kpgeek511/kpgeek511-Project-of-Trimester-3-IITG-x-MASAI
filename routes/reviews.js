const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { requireAuth, requireAdmin, getCurrentUser } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configure multer for review images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads/reviews';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get product reviews
router.get('/product/:productId', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 20 }),
  query('rating').optional().isInt({ min: 1, max: 5 }),
  query('sortBy').optional().isIn(['newest', 'oldest', 'rating_high', 'rating_low', 'helpful'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { productId } = req.params;
    const { page = 1, limit = 10, rating, sortBy = 'newest' } = req.query;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Build filter
    const filter = {
      product: productId,
      status: 'approved',
      isActive: true
    };

    if (rating) {
      filter.rating = parseInt(rating);
    }

    // Build sort
    let sort = {};
    switch (sortBy) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'rating_high':
        sort = { rating: -1, createdAt: -1 };
        break;
      case 'rating_low':
        sort = { rating: 1, createdAt: -1 };
        break;
      case 'helpful':
        sort = { 'helpful.count': -1, createdAt: -1 };
        break;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(filter)
      .populate('user', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    // Get review summary
    const reviewSummary = await Review.getProductReviewSummary(productId);

    res.json({
      success: true,
      data: {
        reviews: reviews,
        summary: reviewSummary,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalReviews: total,
          hasNext: skip + reviews.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
});

// Create review
router.post('/', requireAuth, upload.array('images', 3), [
  body('productId').isMongoId().withMessage('Valid product ID required'),
  body('orderId').isMongoId().withMessage('Valid order ID required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().trim().isLength({ max: 100 }).withMessage('Title too long'),
  body('comment').trim().isLength({ min: 10, max: 1000 }).withMessage('Comment must be 10-1000 characters'),
  body('visibility').optional().isIn(['public', 'private']).withMessage('Invalid visibility setting')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { productId, orderId, rating, title, comment, visibility = 'public' } = req.body;

    // Verify order belongs to user and contains the product
    const order = await Order.findOne({
      _id: orderId,
      user: req.session.userId,
      isActive: true,
      'items.product': productId,
      status: { $in: ['delivered', 'completed'] }
    });

    if (!order) {
      return res.status(400).json({
        success: false,
        message: 'Order not found or product not purchased'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      user: req.session.userId,
      product: productId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Handle uploaded images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => ({
        url: `/uploads/reviews/${file.filename}`,
        alt: file.originalname
      }));
    }

    // Create review
    const review = new Review({
      user: req.session.userId,
      product: productId,
      order: orderId,
      rating: parseInt(rating),
      title: title || '',
      comment: comment,
      images: images,
      visibility: visibility,
      verified: true // Verified since it's from a completed order
    });

    await review.save();

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review'
    });
  }
});

// Update review
router.put('/:id', requireAuth, upload.array('images', 3), [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().trim().isLength({ max: 100 }).withMessage('Title too long'),
  body('comment').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Comment must be 10-1000 characters'),
  body('visibility').optional().isIn(['public', 'private']).withMessage('Invalid visibility setting')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const review = await Review.findOne({
      _id: req.params.id,
      user: req.session.userId,
      isActive: true
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['rating', 'title', 'comment', 'visibility'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        review[field] = req.body[field];
      }
    });

    // Handle new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: `/uploads/reviews/${file.filename}`,
        alt: file.originalname
      }));
      review.images = [...review.images, ...newImages];
    }

    // Reset status to pending for admin review
    review.status = 'pending';

    await review.save();

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review'
    });
  }
});

// Delete review
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      user: req.session.userId,
      isActive: true
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Soft delete
    review.isActive = false;
    await review.save();

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review'
    });
  }
});

// Mark review as helpful
router.post('/:id/helpful', requireAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review || !review.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.user.toString() === req.session.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark your own review as helpful'
      });
    }

    await review.markHelpful(req.session.userId);

    res.json({
      success: true,
      message: 'Review marked as helpful',
      data: {
        helpfulCount: review.helpful.count
      }
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark review as helpful'
    });
  }
});

// Unmark review as helpful
router.delete('/:id/helpful', requireAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review || !review.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.unmarkHelpful(req.session.userId);

    res.json({
      success: true,
      message: 'Review unmarked as helpful',
      data: {
        helpfulCount: review.helpful.count
      }
    });
  } catch (error) {
    console.error('Unmark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unmark review as helpful'
    });
  }
});

// Get user's reviews
router.get('/my-reviews', requireAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 20 }),
  query('status').optional().isIn(['pending', 'approved', 'rejected'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 10, status } = req.query;

    const filter = { user: req.session.userId, isActive: true };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(filter)
      .populate('product', 'name images price')
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    res.json({
      success: true,
      data: {
        reviews: reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalReviews: total,
          hasNext: skip + reviews.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
});

// Get all reviews (Admin only)
router.get('/admin/all', requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'approved', 'rejected']),
  query('visibility').optional().isIn(['public', 'private'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 20, status, visibility } = req.query;

    const filter = { isActive: true };
    if (status) filter.status = status;
    if (visibility) filter.visibility = visibility;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('product', 'name images')
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    res.json({
      success: true,
      data: {
        reviews: reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalReviews: total,
          hasNext: skip + reviews.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
});

// Update review status (Admin only)
router.put('/:id/status', requireAdmin, [
  body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Valid status required'),
  body('adminResponse').optional().trim().isLength({ max: 500 }).withMessage('Admin response too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, adminResponse } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.status = status;
    if (adminResponse) {
      review.adminResponse = {
        message: adminResponse,
        respondedBy: req.session.userId,
        respondedAt: new Date()
      };
    }

    await review.save();

    res.json({
      success: true,
      message: 'Review status updated successfully',
      data: review
    });
  } catch (error) {
    console.error('Update review status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review status'
    });
  }
});

// Get review statistics (Admin only)
router.get('/admin/statistics', requireAdmin, async (req, res) => {
  try {
    const stats = await Review.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const ratingStats = await Review.aggregate([
      { $match: { isActive: true, status: 'approved' } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalReviews = await Review.countDocuments({ isActive: true });
    const approvedReviews = await Review.countDocuments({ isActive: true, status: 'approved' });
    const pendingReviews = await Review.countDocuments({ isActive: true, status: 'pending' });

    res.json({
      success: true,
      data: {
        statusBreakdown: stats,
        ratingBreakdown: ratingStats,
        totalReviews,
        approvedReviews,
        pendingReviews
      }
    });
  } catch (error) {
    console.error('Get review statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review statistics'
    });
  }
});

module.exports = router;

