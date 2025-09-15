const express = require('express');
const { body, validationResult } = require('express-validator');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const GroupOrder = require('../models/GroupOrder');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
router.post('/create-order', requireAuth, [
  body('orderId').isMongoId().withMessage('Valid order ID required'),
  body('amount').isFloat({ min: 1 }).withMessage('Valid amount required')
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

    const { orderId, amount } = req.body;

    // Verify order belongs to user
    const order = await Order.findOne({
      _id: orderId,
      user: req.session.userId,
      isActive: true
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify amount matches order total
    if (Math.round(amount * 100) !== Math.round(order.pricing.total * 100)) {
      return res.status(400).json({
        success: false,
        message: 'Amount mismatch'
      });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Amount in paise
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order._id.toString(),
        userId: req.session.userId
      }
    });

    // Update order with Razorpay order ID
    order.payment.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json({
      success: true,
      message: 'Razorpay order created successfully',
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order'
    });
  }
});

// Verify payment
router.post('/verify', requireAuth, [
  body('razorpayOrderId').notEmpty().withMessage('Razorpay order ID required'),
  body('razorpayPaymentId').notEmpty().withMessage('Razorpay payment ID required'),
  body('razorpaySignature').notEmpty().withMessage('Razorpay signature required')
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

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Find order
    const order = await Order.findOne({
      'payment.razorpayOrderId': razorpayOrderId,
      user: req.session.userId,
      isActive: true
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update order payment status
    order.payment.status = 'completed';
    order.payment.razorpayPaymentId = razorpayPaymentId;
    order.payment.razorpaySignature = razorpaySignature;
    order.payment.paidAt = new Date();
    order.status = 'confirmed';

    await order.save();

    // If it's a group order, update group order payment
    if (order.groupOrder) {
      const groupOrder = await GroupOrder.findById(order.groupOrder);
      if (groupOrder) {
        groupOrder.payment.collectedAmount += order.pricing.total;
        groupOrder.payment.pendingAmount = groupOrder.pricing.total - groupOrder.payment.collectedAmount;
        
        if (groupOrder.payment.pendingAmount <= 0) {
          groupOrder.payment.status = 'completed';
        } else {
          groupOrder.payment.status = 'partial';
        }
        
        await groupOrder.save();
      }
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentId: razorpayPaymentId,
        amount: order.pricing.total,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
});

// Get payment details
router.get('/:orderId', requireAuth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.session.userId,
      isActive: true
    }).select('payment pricing status orderNumber');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        amount: order.pricing.total,
        status: order.payment.status,
        method: order.payment.method,
        transactionId: order.payment.transactionId,
        razorpayOrderId: order.payment.razorpayOrderId,
        razorpayPaymentId: order.payment.razorpayPaymentId,
        paidAt: order.payment.paidAt
      }
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details'
    });
  }
});

// Refund payment (Admin only)
router.post('/refund', requireAdmin, [
  body('orderId').isMongoId().withMessage('Valid order ID required'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Valid refund amount required'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason too long')
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

    const { orderId, amount, reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Order payment not completed'
      });
    }

    if (order.payment.refundedAt) {
      return res.status(400).json({
        success: false,
        message: 'Order already refunded'
      });
    }

    const refundAmount = amount || order.pricing.total;

    // Create Razorpay refund
    const refund = await razorpay.payments.refund(order.payment.razorpayPaymentId, {
      amount: Math.round(refundAmount * 100),
      notes: {
        reason: reason || 'Refund requested by admin',
        orderId: order._id.toString()
      }
    });

    // Update order
    order.payment.status = 'refunded';
    order.payment.refundedAt = new Date();
    order.payment.refundAmount = refundAmount;
    order.payment.refundReason = reason || 'Refund requested by admin';
    order.status = 'refunded';

    await order.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refund.id,
        amount: refundAmount,
        status: refund.status
      }
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Refund processing failed'
    });
  }
});

// Get payment statistics (Admin only)
router.get('/admin/statistics', requireAdmin, async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$payment.status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$pricing.total' }
        }
      }
    ]);

    const totalRevenue = await Order.aggregate([
      { $match: { isActive: true, 'payment.status': 'completed' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } }
    ]);

    const refundedAmount = await Order.aggregate([
      { $match: { isActive: true, 'payment.status': 'refunded' } },
      { $group: { _id: null, total: { $sum: '$payment.refundAmount' } } }
    ]);

    const recentPayments = await Order.find({
      isActive: true,
      'payment.status': { $in: ['completed', 'refunded'] }
    })
    .populate('user', 'firstName lastName')
    .sort({ 'payment.paidAt': -1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        statusBreakdown: stats,
        totalRevenue: totalRevenue[0]?.total || 0,
        refundedAmount: refundedAmount[0]?.total || 0,
        recentPayments
      }
    });
  } catch (error) {
    console.error('Get payment statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics'
    });
  }
});

// Webhook for Razorpay events
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const body = req.body;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({
      success: false,
      message: 'Invalid webhook signature'
    });
  }

  const event = JSON.parse(body);

  // Handle different webhook events
  switch (event.event) {
    case 'payment.captured':
      handlePaymentCaptured(event.payload.payment.entity);
      break;
    case 'payment.failed':
      handlePaymentFailed(event.payload.payment.entity);
      break;
    case 'refund.created':
      handleRefundCreated(event.payload.refund.entity);
      break;
    default:
      console.log('Unhandled webhook event:', event.event);
  }

  res.json({ success: true });
});

// Handle payment captured webhook
async function handlePaymentCaptured(payment) {
  try {
    const order = await Order.findOne({
      'payment.razorpayPaymentId': payment.id
    });

    if (order && order.payment.status === 'pending') {
      order.payment.status = 'completed';
      order.payment.paidAt = new Date();
      order.status = 'confirmed';
      await order.save();
    }
  } catch (error) {
    console.error('Handle payment captured error:', error);
  }
}

// Handle payment failed webhook
async function handlePaymentFailed(payment) {
  try {
    const order = await Order.findOne({
      'payment.razorpayPaymentId': payment.id
    });

    if (order) {
      order.payment.status = 'failed';
      order.status = 'cancelled';
      await order.save();
    }
  } catch (error) {
    console.error('Handle payment failed error:', error);
  }
}

// Handle refund created webhook
async function handleRefundCreated(refund) {
  try {
    const order = await Order.findOne({
      'payment.razorpayPaymentId': refund.payment_id
    });

    if (order) {
      order.payment.status = 'refunded';
      order.payment.refundedAt = new Date();
      order.payment.refundAmount = refund.amount / 100;
      order.status = 'refunded';
      await order.save();
    }
  } catch (error) {
    console.error('Handle refund created error:', error);
  }
}

module.exports = router;

