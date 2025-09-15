const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Distribution = require('../models/Distribution');
const Order = require('../models/Order');
const GroupOrder = require('../models/GroupOrder');
const User = require('../models/User');
const { requireAuth, requireAdmin, requireDepartmentHead } = require('../middleware/auth');
const router = express.Router();

// Get distribution assignments for user
router.get('/my-assignments', requireAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'assigned', 'ready', 'in_transit', 'delivered', 'cancelled'])
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

    const filter = { assignedTo: req.session.userId, isActive: true };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const distributions = await Distribution.find(filter)
      .populate('order', 'orderNumber user pricing')
      .populate('groupOrder', 'name department')
      .populate('order.user', 'firstName lastName email phone')
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Distribution.countDocuments(filter);

    res.json({
      success: true,
      data: {
        distributions: distributions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalAssignments: total,
          hasNext: skip + distributions.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments'
    });
  }
});

// Get single distribution
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const distribution = await Distribution.findById(req.params.id)
      .populate('order', 'orderNumber user pricing items')
      .populate('groupOrder', 'name department')
      .populate('order.user', 'firstName lastName email phone')
      .populate('assignedTo', 'firstName lastName email phone');

    if (!distribution || !distribution.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Distribution not found'
      });
    }

    // Check if user has access to this distribution
    const hasAccess = distribution.assignedTo._id.toString() === req.session.userId ||
                     req.user.role === 'admin' ||
                     req.user.role === 'department_head';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('Get distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch distribution'
    });
  }
});

// Create distribution assignment (Admin/Department Head)
router.post('/', requireDepartmentHead, [
  body('orderId').isMongoId().withMessage('Valid order ID required'),
  body('assignedTo').isMongoId().withMessage('Valid user ID required'),
  body('location.name').trim().isLength({ min: 2, max: 100 }).withMessage('Location name required'),
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date required'),
  body('location.address.street').optional().trim().isLength({ max: 200 }),
  body('location.address.city').optional().trim().isLength({ max: 50 }),
  body('location.address.state').optional().trim().isLength({ max: 50 }),
  body('location.address.pincode').optional().isPostalCode('IN'),
  body('location.contactPerson.name').optional().trim().isLength({ max: 100 }),
  body('location.contactPerson.phone').optional().isMobilePhone('en-IN'),
  body('location.contactPerson.email').optional().isEmail()
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

    const { orderId, assignedTo, location, scheduledDate, tracking } = req.body;

    // Verify order exists and is ready for distribution
    const order = await Order.findById(orderId);
    if (!order || !order.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!['confirmed', 'processing'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order not ready for distribution'
      });
    }

    // Verify assigned user exists
    const user = await User.findById(assignedTo);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Assigned user not found'
      });
    }

    // Check if distribution already exists for this order
    const existingDistribution = await Distribution.findOne({
      order: orderId,
      isActive: true
    });

    if (existingDistribution) {
      return res.status(400).json({
        success: false,
        message: 'Distribution already exists for this order'
      });
    }

    // Create distribution
    const distribution = new Distribution({
      order: orderId,
      groupOrder: order.groupOrder,
      assignedTo: assignedTo,
      location: location,
      scheduledDate: new Date(scheduledDate),
      tracking: tracking || {},
      items: order.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        status: 'pending'
      }))
    });

    await distribution.save();

    // Update order status
    order.status = 'processing';
    order.distribution = {
      assignedTo: assignedTo,
      location: location.name,
      scheduledDate: new Date(scheduledDate),
      status: 'assigned'
    };
    await order.save();

    res.status(201).json({
      success: true,
      message: 'Distribution assignment created successfully',
      data: distribution
    });
  } catch (error) {
    console.error('Create distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create distribution assignment'
    });
  }
});

// Update distribution status
router.put('/:id/status', requireAuth, [
  body('status').isIn(['pending', 'assigned', 'ready', 'in_transit', 'delivered', 'cancelled']).withMessage('Valid status required'),
  body('note').optional().trim().isLength({ max: 500 }).withMessage('Note too long')
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

    const { status, note } = req.body;

    const distribution = await Distribution.findById(req.params.id);
    if (!distribution || !distribution.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Distribution not found'
      });
    }

    // Check if user has permission to update
    const canUpdate = distribution.assignedTo.toString() === req.session.userId ||
                     req.user.role === 'admin' ||
                     req.user.role === 'department_head';

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    const oldStatus = distribution.status;
    distribution.status = status;

    if (note) {
      distribution.timeline.push({
        status: status,
        timestamp: new Date(),
        note: note,
        updatedBy: req.session.userId
      });
    }

    // Update actual date for certain statuses
    if (['in_transit', 'delivered'].includes(status) && !distribution.actualDate) {
      distribution.actualDate = new Date();
    }

    await distribution.save();

    // Update order status if delivered
    if (status === 'delivered') {
      await Order.findByIdAndUpdate(distribution.order, {
        status: 'delivered',
        'distribution.status': 'delivered',
        'distribution.actualDate': new Date()
      });
    }

    res.json({
      success: true,
      message: 'Distribution status updated successfully',
      data: distribution
    });
  } catch (error) {
    console.error('Update distribution status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update distribution status'
    });
  }
});

// Update item status in distribution
router.put('/:id/items/:itemId', requireAuth, [
  body('status').isIn(['pending', 'packed', 'shipped', 'delivered']).withMessage('Valid item status required'),
  body('notes').optional().trim().isLength({ max: 200 }).withMessage('Notes too long')
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

    const { status, notes } = req.body;

    const distribution = await Distribution.findById(req.params.id);
    if (!distribution || !distribution.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Distribution not found'
      });
    }

    // Check if user has permission
    const canUpdate = distribution.assignedTo.toString() === req.session.userId ||
                     req.user.role === 'admin' ||
                     req.user.role === 'department_head';

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    const item = distribution.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    item.status = status;
    if (notes) {
      item.notes = notes;
    }

    await distribution.save();

    res.json({
      success: true,
      message: 'Item status updated successfully',
      data: distribution
    });
  } catch (error) {
    console.error('Update item status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update item status'
    });
  }
});

// Add delivery proof
router.put('/:id/delivery-proof', requireAuth, [
  body('signature').optional().trim().isLength({ max: 1000 }),
  body('image').optional().trim().isLength({ max: 500 }),
  body('receivedBy.name').trim().isLength({ min: 2, max: 100 }).withMessage('Receiver name required'),
  body('receivedBy.phone').isMobilePhone('en-IN').withMessage('Valid phone number required'),
  body('receivedBy.signature').optional().trim().isLength({ max: 1000 })
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

    const { signature, image, receivedBy } = req.body;

    const distribution = await Distribution.findById(req.params.id);
    if (!distribution || !distribution.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Distribution not found'
      });
    }

    // Check if user has permission
    const canUpdate = distribution.assignedTo.toString() === req.session.userId ||
                     req.user.role === 'admin' ||
                     req.user.role === 'department_head';

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    distribution.deliveryProof = {
      signature: signature || '',
      image: image || '',
      deliveredBy: req.session.userId,
      receivedBy: receivedBy
    };

    distribution.status = 'delivered';
    distribution.actualDate = new Date();

    await distribution.save();

    // Update order status
    await Order.findByIdAndUpdate(distribution.order, {
      status: 'delivered',
      'distribution.status': 'delivered',
      'distribution.actualDate': new Date()
    });

    res.json({
      success: true,
      message: 'Delivery proof added successfully',
      data: distribution
    });
  } catch (error) {
    console.error('Add delivery proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add delivery proof'
    });
  }
});

// Get all distributions (Admin/Department Head)
router.get('/admin/all', requireDepartmentHead, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'assigned', 'ready', 'in_transit', 'delivered', 'cancelled']),
  query('assignedTo').optional().isMongoId()
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

    const { page = 1, limit = 20, status, assignedTo } = req.query;

    const filter = { isActive: true };
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const distributions = await Distribution.find(filter)
      .populate('order', 'orderNumber user pricing')
      .populate('groupOrder', 'name department')
      .populate('order.user', 'firstName lastName email phone')
      .populate('assignedTo', 'firstName lastName email phone')
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Distribution.countDocuments(filter);

    res.json({
      success: true,
      data: {
        distributions: distributions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalDistributions: total,
          hasNext: skip + distributions.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all distributions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch distributions'
    });
  }
});

// Get distribution statistics
router.get('/admin/statistics', requireAdmin, async (req, res) => {
  try {
    const stats = await Distribution.getStatistics();
    const overdue = await Distribution.getOverdue();

    res.json({
      success: true,
      data: {
        statusBreakdown: stats,
        overdueDistributions: overdue.length,
        overdueList: overdue
      }
    });
  } catch (error) {
    console.error('Get distribution statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch distribution statistics'
    });
  }
});

// Cancel distribution
router.put('/:id/cancel', requireDepartmentHead, [
  body('reason').trim().isLength({ min: 5, max: 500 }).withMessage('Cancellation reason required')
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

    const { reason } = req.body;

    const distribution = await Distribution.findById(req.params.id);
    if (!distribution || !distribution.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Distribution not found'
      });
    }

    if (!distribution.canCancel) {
      return res.status(400).json({
        success: false,
        message: 'Distribution cannot be cancelled at this stage'
      });
    }

    distribution.status = 'cancelled';
    distribution.timeline.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: reason,
      updatedBy: req.session.userId
    });

    await distribution.save();

    res.json({
      success: true,
      message: 'Distribution cancelled successfully',
      data: distribution
    });
  } catch (error) {
    console.error('Cancel distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel distribution'
    });
  }
});

module.exports = router;

