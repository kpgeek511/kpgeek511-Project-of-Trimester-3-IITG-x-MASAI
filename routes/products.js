const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { requireAuth, requireAdmin, getCurrentUser } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads/products';
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
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get all products with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().isIn(['apparel', 'accessories', 'stationery', 'electronics', 'sports', 'books', 'gifts', 'other']),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be non-negative'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be non-negative'),
  query('search').optional().trim().isLength({ max: 100 }),
  query('sortBy').optional().isIn(['name', 'price', 'rating', 'createdAt', 'sales']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
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

    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.finalPrice = {};
      if (minPrice) filter.finalPrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.finalPrice.$lte = parseFloat(maxPrice);
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get products
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'firstName lastName')
      .lean();

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    // Calculate final prices for products
    const productsWithPrices = products.map(product => {
      const finalPrice = product.discount > 0 
        ? product.price - (product.price * product.discount / 100)
        : product.price;
      
      return {
        ...product,
        finalPrice: Math.round(finalPrice * 100) / 100
      };
    });

    res.json({
      success: true,
      data: {
        products: productsWithPrices,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalProducts: total,
          hasNext: skip + products.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('lastModifiedBy', 'firstName lastName');

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get reviews for the product
    const reviews = await Review.find({
      product: product._id,
      status: 'approved',
      isActive: true
    })
    .populate('user', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10);

    // Get review summary
    const reviewSummary = await Review.getProductReviewSummary(product._id);

    const productData = product.toObject();
    productData.finalPrice = product.finalPrice;
    productData.inStock = product.inStock;
    productData.primaryImage = product.primaryImage;

    res.json({
      success: true,
      data: {
        product: productData,
        reviews: reviews,
        reviewSummary: reviewSummary
      }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
});

// Create product (Admin only)
router.post('/', requireAdmin, upload.array('images', 5), [
  body('name').trim().isLength({ min: 3, max: 200 }).withMessage('Product name must be 3-200 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  body('category').isIn(['clothing', 'accessories', 'stationery', 'electronics', 'sports', 'other']).withMessage('Valid category required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be non-negative'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be non-negative integer')
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

    const productData = req.body;
    productData.createdBy = req.session.userId;

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map((file, index) => ({
        url: `/uploads/products/${file.filename}`,
        alt: productData.imageAlts && productData.imageAlts[index] || '',
        isPrimary: index === 0
      }));
    }

    // Handle variants if provided
    if (productData.variants) {
      try {
        productData.variants = JSON.parse(productData.variants);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid variants format'
        });
      }
    }

    // Handle bulk discount if provided
    if (productData.bulkDiscount) {
      try {
        productData.bulkDiscount = JSON.parse(productData.bulkDiscount);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid bulk discount format'
        });
      }
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
});

// Update product (Admin only)
router.put('/:id', requireAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const allowedUpdates = [
      'name', 'description', 'shortDescription', 'category', 'subcategory',
      'price', 'originalPrice', 'discount', 'stock', 'tags', 'specifications',
      'isActive', 'isFeatured', 'minOrderQuantity', 'maxOrderQuantity', 'bulkDiscount'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'bulkDiscount' && typeof req.body[key] === 'string') {
          try {
            updates[key] = JSON.parse(req.body[key]);
          } catch (e) {
            return res.status(400).json({
              success: false,
              message: 'Invalid bulk discount format'
            });
          }
        } else {
          updates[key] = req.body[key];
        }
      }
    });

    // Handle new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: `/uploads/products/${file.filename}`,
        alt: req.body.imageAlts && req.body.imageAlts[index] || '',
        isPrimary: false
      }));
      
      updates.images = [...product.images, ...newImages];
    }

    updates.lastModifiedBy = req.session.userId;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
});

// Delete product (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
});

// Get product categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    
    const categoryInfo = await Promise.all(
      categories.map(async (category) => {
        const count = await Product.countDocuments({ category, isActive: true });
        return {
          name: category,
          count: count
        };
      })
    );

    res.json({
      success: true,
      data: categoryInfo
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// Get featured products
router.get('/featured/list', async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      isFeatured: true
    })
    .sort({ createdAt: -1 })
    .limit(8)
    .populate('createdBy', 'firstName lastName')
    .lean();

    const productsWithPrices = products.map(product => {
      const finalPrice = product.discount > 0 
        ? product.price - (product.price * product.discount / 100)
        : product.price;
      
      return {
        ...product,
        finalPrice: Math.round(finalPrice * 100) / 100
      };
    });

    res.json({
      success: true,
      data: productsWithPrices
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured products'
    });
  }
});

// Search products
router.get('/search/query', [
  query('q').trim().isLength({ min: 1, max: 100 }).withMessage('Search query required'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
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

    const { q, page = 1, limit = 12 } = req.query;

    const searchRegex = new RegExp(q, 'i');
    const filter = {
      isActive: true,
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } },
        { category: searchRegex },
        { subcategory: searchRegex }
      ]
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'firstName lastName')
      .lean();

    const total = await Product.countDocuments(filter);

    const productsWithPrices = products.map(product => {
      const finalPrice = product.discount > 0 
        ? product.price - (product.price * product.discount / 100)
        : product.price;
      
      return {
        ...product,
        finalPrice: Math.round(finalPrice * 100) / 100
      };
    });

    res.json({
      success: true,
      data: {
        products: productsWithPrices,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalProducts: total,
          hasNext: skip + products.length < total,
          hasPrev: parseInt(page) > 1
        },
        query: q
      }
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

module.exports = router;
