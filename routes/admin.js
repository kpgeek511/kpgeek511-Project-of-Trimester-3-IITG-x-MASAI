const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const GroupOrder = require('../models/GroupOrder');
const Review = require('../models/Review');
const Distribution = require('../models/Distribution');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    // Get user statistics
    const userStats = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get product statistics
    const productStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' }
        }
      }
    ]);

    // Get order statistics
    const orderStats = await Order.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$pricing.total' }
        }
      }
    ]);

    // Get revenue statistics
    const revenueStats = await Order.aggregate([
      { $match: { isActive: true, 'payment.status': 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Get recent activities
    const recentOrders = await Order.find({ isActive: true })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentReviews = await Review.find({ isActive: true })
      .populate('user', 'firstName lastName')
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const pendingDistributions = await Distribution.find({
      isActive: true,
      status: { $in: ['pending', 'assigned'] }
    })
    .populate('order', 'orderNumber')
    .populate('assignedTo', 'firstName lastName')
    .sort({ scheduledDate: 1 })
    .limit(5);

    // Calculate totals
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalOrders = await Order.countDocuments({ isActive: true });
    const totalRevenue = await Order.aggregate([
      { $match: { isActive: true, 'payment.status': 'completed' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0
        },
        userStats,
        productStats,
        orderStats,
        revenueStats,
        recentActivities: {
          orders: recentOrders,
          reviews: recentReviews,
          distributions: pendingDistributions
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// User management
router.get('/users', requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('role').optional().isIn(['user', 'department_head', 'admin']),
  query('search').optional().trim().isLength({ max: 100 }),
  query('isActive').optional().isBoolean()
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

    const { page = 1, limit = 20, role, search, isActive } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users: users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalUsers: total,
          hasNext: skip + users.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Update user role
router.put('/users/:id/role', requireAdmin, [
  body('role').isIn(['user', 'department_head', 'admin']).withMessage('Valid role required')
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

    const { role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
});

// Toggle user active status
router.put('/users/:id/toggle-active', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    console.error('Toggle user active status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle user status'
    });
  }
});

// Group order management
router.get('/group-orders', requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['active', 'closed', 'completed', 'cancelled']),
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

    const { page = 1, limit = 20, status, department } = req.query;

    const filter = { isActive: true };
    if (status) filter.status = status;
    if (department) filter.department = department;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const groupOrders = await GroupOrder.find(filter)
      .populate('organizer', 'firstName lastName email')
      .populate('members.user', 'firstName lastName email')
      .populate('orders', 'orderNumber status pricing')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await GroupOrder.countDocuments(filter);

    res.json({
      success: true,
      data: {
        groupOrders: groupOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalGroupOrders: total,
          hasNext: skip + groupOrders.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get group orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group orders'
    });
  }
});

// Update group order status
router.put('/group-orders/:id/status', requireAdmin, [
  body('status').isIn(['active', 'closed', 'completed', 'cancelled']).withMessage('Valid status required'),
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

    const groupOrder = await GroupOrder.findById(req.params.id);
    if (!groupOrder) {
      return res.status(404).json({
        success: false,
        message: 'Group order not found'
      });
    }

    groupOrder.status = status;
    if (note) {
      groupOrder.notes = groupOrder.notes || {};
      groupOrder.notes.admin = note;
    }

    await groupOrder.save();

    res.json({
      success: true,
      message: 'Group order status updated successfully',
      data: groupOrder
    });
  } catch (error) {
    console.error('Update group order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update group order status'
    });
  }
});

// Get system analytics
router.get('/analytics', requireAdmin, [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
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

    const { period = '30d', startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      const now = new Date();
      let days = 30;
      switch (period) {
        case '7d': days = 7; break;
        case '30d': days = 30; break;
        case '90d': days = 90; break;
        case '1y': days = 365; break;
      }
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
        }
      };
    }

    // Revenue analytics
    const revenueData = await Order.aggregate([
      { $match: { isActive: true, 'payment.status': 'completed', ...dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Product performance
    const productPerformance = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'items.product',
          as: 'orders'
        }
      },
      {
        $project: {
          name: 1,
          category: 1,
          price: 1,
          sales: 1,
          totalSold: { $sum: '$orders.items.quantity' },
          revenue: { $multiply: ['$price', { $sum: '$orders.items.quantity' }] }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    // User activity
    const userActivity = await User.aggregate([
      { $match: { isActive: true, ...dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Category performance
    const categoryPerformance = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'items.product',
          as: 'orders'
        }
      },
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          totalSold: { $sum: { $sum: '$orders.items.quantity' } },
          revenue: { $sum: { $multiply: ['$price', { $sum: '$orders.items.quantity' }] } }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        revenueData,
        productPerformance,
        userActivity,
        categoryPerformance
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

// Get system settings
router.get('/settings', requireAdmin, async (req, res) => {
  try {
    // This would typically come from a settings collection
    // For now, return default settings
    const settings = {
      siteName: 'Merchandise Portal',
      siteDescription: 'Campus merchandise ordering platform',
      currency: 'INR',
      taxRate: 18,
      freeShippingThreshold: 500,
      maxOrderQuantity: 10,
      orderDeadlineHours: 24,
      emailNotifications: true,
      smsNotifications: true,
      maintenanceMode: false,
      allowRegistration: true,
      requireEmailVerification: false,
      requirePhoneVerification: false
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
});

// Update system settings
router.put('/settings', requireAdmin, [
  body('siteName').optional().trim().isLength({ min: 2, max: 100 }),
  body('siteDescription').optional().trim().isLength({ max: 500 }),
  body('currency').optional().isLength({ min: 3, max: 3 }),
  body('taxRate').optional().isFloat({ min: 0, max: 100 }),
  body('freeShippingThreshold').optional().isFloat({ min: 0 }),
  body('maxOrderQuantity').optional().isInt({ min: 1 }),
  body('orderDeadlineHours').optional().isInt({ min: 1 }),
  body('emailNotifications').optional().isBoolean(),
  body('smsNotifications').optional().isBoolean(),
  body('maintenanceMode').optional().isBoolean(),
  body('allowRegistration').optional().isBoolean(),
  body('requireEmailVerification').optional().isBoolean(),
  body('requirePhoneVerification').optional().isBoolean()
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

    // In a real application, you would save these to a settings collection
    // For now, just return the updated settings
    const updatedSettings = req.body;

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

// Export data
router.get('/export/:type', requireAdmin, [
  query('format').optional().isIn(['json', 'csv']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
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

    const { type } = req.params;
    const { format = 'json', startDate, endDate } = req.query;

    let data = [];
    let filename = '';

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    switch (type) {
      case 'users':
        data = await User.find({ isActive: true, ...dateFilter }).select('-password');
        filename = 'users';
        break;
      case 'orders':
        data = await Order.find({ isActive: true, ...dateFilter })
          .populate('user', 'firstName lastName email')
          .populate('items.product', 'name price');
        filename = 'orders';
        break;
      case 'products':
        data = await Product.find({ isActive: true, ...dateFilter });
        filename = 'products';
        break;
      case 'reviews':
        data = await Review.find({ isActive: true, ...dateFilter })
          .populate('user', 'firstName lastName')
          .populate('product', 'name');
        filename = 'reviews';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }

    if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      return res.json({
        success: true,
        data: data,
        exportedAt: new Date(),
        totalRecords: data.length
      });
    }
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data'
    });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0].toObject ? data[0].toObject() : data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => {
      const obj = row.toObject ? row.toObject() : row;
      return headers.map(header => {
        const value = obj[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',');
    })
  ].join('\n');
  
  return csvContent;
}

module.exports = router;

