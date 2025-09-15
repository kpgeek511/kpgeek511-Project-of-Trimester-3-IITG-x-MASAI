const User = require('../models/User');

// Check if user is authenticated
const requireAuth = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId).select('-password');
      if (user && user.isActive) {
        req.user = user;
        return next();
      }
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
};

// Check if user has specific role
const requireRole = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const user = await User.findById(req.session.userId).select('role isActive');
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during authentication'
      });
    }
  };
};

// Check if user is admin
const requireAdmin = requireRole('admin');

// Check if user is department head or admin
const requireDepartmentHead = requireRole('department_head', 'admin');

// Check if user is department head, admin, or group admin
const requireGroupAccess = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await User.findById(req.session.userId).select('role isActive');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Admin and department heads have access
    if (['admin', 'department_head'].includes(user.role)) {
      req.user = user;
      return next();
    }

    // For group orders, check if user is group admin
    if (req.params.groupId) {
      const GroupOrder = require('../models/GroupOrder');
      const groupOrder = await GroupOrder.findById(req.params.groupId);
      
      if (!groupOrder) {
        return res.status(404).json({
          success: false,
          message: 'Group order not found'
        });
      }

      if (groupOrder.isAdmin(req.session.userId)) {
        req.user = user;
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions'
    });
  } catch (error) {
    console.error('Group access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Get current user info
const getCurrentUser = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId).select('-password');
      req.user = user;
    }
    next();
  } catch (error) {
    console.error('Get current user error:', error);
    next();
  }
};

// Check if user owns resource
const requireOwnership = (resourceField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.resource && req.resource[resourceField];
    if (resourceUserId && resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - resource ownership required'
      });
    }

    next();
  };
};

// Rate limiting for auth endpoints
const authRateLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin,
  requireDepartmentHead,
  requireGroupAccess,
  getCurrentUser,
  requireOwnership,
  authRateLimit
};
