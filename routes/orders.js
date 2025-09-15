const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Order = require('../models/Order');
const GroupOrder = require('../models/GroupOrder');
const Product = require('../models/Product');
const { requireAuth, requireAdmin, requireDepartmentHead, getCurrentUser } = require('../middleware/auth');
const router = express.Router();

// Get user's orders
router.get('/my-orders', requireAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
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

    const orders = await Order.find(filter)
      .populate('items.product', 'name price images')
      .populate('groupOrder', 'name department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders: orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalOrders: total,
          hasNext: skip + orders.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Get single order
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.session.userId,
      isActive: true
    })
    .populate('items.product', 'name price images description')
    .populate('groupOrder', 'name department')
    .populate('distribution.assignedTo', 'firstName lastName email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
});

// Create individual order
router.post('/', requireAuth, [
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.product').isMongoId().withMessage('Valid product ID required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity required'),
  body('shippingAddress').isObject().withMessage('Shipping address required'),
  body('payment.method').isIn(['razorpay', 'paytm', 'upi', 'cod']).withMessage('Valid payment method required')
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

    const { items, shippingAddress, billingAddress, payment, notes } = req.body;

    // Validate products and calculate pricing
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.product} not found or inactive`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${product.name}`
        });
      }

      const itemPrice = product.finalPrice;
      const variantPriceModifier = item.variant?.priceModifier || 0;
      const totalItemPrice = (itemPrice + variantPriceModifier) * item.quantity;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: itemPrice,
        variant: item.variant || {},
        totalPrice: totalItemPrice
      });

      subtotal += totalItemPrice;
    }

    // Calculate totals
    const discount = 0; // Can be calculated based on promotions
    const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST
    const shipping = subtotal > 500 ? 0 : 50; // Free shipping above 500
    const total = subtotal - discount + tax + shipping;

    // Create order
    const order = new Order({
      user: req.session.userId,
      items: orderItems,
      orderType: 'individual',
      shippingAddress: shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      pricing: {
        subtotal,
        discount,
        tax,
        shipping,
        total
      },
      payment: {
        method: payment.method,
        status: 'pending'
      },
      notes: {
        customer: notes?.customer || '',
        admin: ''
      }
    });

    await order.save();

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity, 'sales.totalSold': item.quantity } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
});

// Create group order
router.post('/group', requireAuth, [
  body('groupOrderId').isMongoId().withMessage('Valid group order ID required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.product').isMongoId().withMessage('Valid product ID required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity required'),
  body('shippingAddress').isObject().withMessage('Shipping address required'),
  body('payment.method').isIn(['razorpay', 'paytm', 'upi', 'cod']).withMessage('Valid payment method required')
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

    const { groupOrderId, items, shippingAddress, billingAddress, payment, notes } = req.body;

    // Check if group order exists and user is member
    const groupOrder = await GroupOrder.findById(groupOrderId);
    if (!groupOrder) {
      return res.status(404).json({
        success: false,
        message: 'Group order not found'
      });
    }

    if (!groupOrder.isMember(req.session.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group order'
      });
    }

    if (!groupOrder.isOpen) {
      return res.status(400).json({
        success: false,
        message: 'Group order is closed for new orders'
      });
    }

    // Validate products and calculate pricing (same as individual order)
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.product} not found or inactive`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${product.name}`
        });
      }

      const itemPrice = product.finalPrice;
      const variantPriceModifier = item.variant?.priceModifier || 0;
      const totalItemPrice = (itemPrice + variantPriceModifier) * item.quantity;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: itemPrice,
        variant: item.variant || {},
        totalPrice: totalItemPrice
      });

      subtotal += totalItemPrice;
    }

    // Calculate totals
    const discount = 0; // Can be calculated based on group discounts
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const shipping = 0; // Group orders might have different shipping rules
    const total = subtotal - discount + tax + shipping;

    // Create order
    const order = new Order({
      user: req.session.userId,
      items: orderItems,
      orderType: 'group',
      groupOrder: groupOrderId,
      shippingAddress: shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      pricing: {
        subtotal,
        discount,
        tax,
        shipping,
        total
      },
      payment: {
        method: payment.method,
        status: 'pending'
      },
      notes: {
        customer: notes?.customer || '',
        admin: ''
      }
    });

    await order.save();

    // Add order to group order
    groupOrder.orders.push(order._id);
    await groupOrder.calculatePricing();
    await groupOrder.save();

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity, 'sales.totalSold': item.quantity } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Group order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Create group order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group order'
    });
  }
});

// Cancel order
router.put('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.session.userId,
      isActive: true
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.canCancel) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    order.status = 'cancelled';
    await order.save();

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity, 'sales.totalSold': -item.quantity } }
      );
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  }
});

// Get all orders (Admin/Department Head)
router.get('/admin/all', requireDepartmentHead, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  query('orderType').optional().isIn(['individual', 'group']),
  query('department').optional().trim()
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

    const { page = 1, limit = 20, status, orderType, department } = req.query;

    const filter = { isActive: true };

    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;

    // If user is department head, filter by department
    if (req.user.role === 'department_head' && department) {
      filter.department = department;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate('user', 'firstName lastName email phone department')
      .populate('items.product', 'name price images')
      .populate('groupOrder', 'name department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders: orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalOrders: total,
          hasNext: skip + orders.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Update order status (Admin/Department Head)
router.put('/:id/status', requireDepartmentHead, [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('Valid status required'),
  body('note').optional().trim().isLength({ max: 500 })
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

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const oldStatus = order.status;
    order.status = status;

    if (note) {
      order.notes.admin = note;
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

// Get order statistics
router.get('/admin/statistics', requireAdmin, async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$pricing.total' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments({ isActive: true });
    const totalRevenue = await Order.aggregate([
      { $match: { isActive: true, 'payment.status': 'completed' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } }
    ]);

    const recentOrders = await Order.find({ isActive: true })
      .populate('user', 'firstName lastName')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        statusBreakdown: stats,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Get order statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics'
    });
  }
});

module.exports = router;

