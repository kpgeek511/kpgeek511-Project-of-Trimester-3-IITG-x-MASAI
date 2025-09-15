const mongoose = require('mongoose');

const groupOrderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['member', 'admin'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  status: {
    type: String,
    enum: ['active', 'closed', 'completed', 'cancelled'],
    default: 'active'
  },
  settings: {
    allowMemberOrders: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    maxOrderValue: {
      type: Number,
      default: null
    },
    deadline: {
      type: Date,
      required: true
    },
    distributionDate: {
      type: Date
    },
    distributionLocation: {
      type: String,
      trim: true
    }
  },
  pricing: {
    subtotal: {
      type: Number,
      default: 0,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    shipping: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'partial', 'completed', 'failed'],
      default: 'pending'
    },
    collectedAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    pendingAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'paytm', 'upi', 'cod', 'mixed']
    }
  },
  notifications: {
    deadlineReminder: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    },
    distributionReminder: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate pricing when orders change
groupOrderSchema.methods.calculatePricing = function() {
  let subtotal = 0;
  let discount = 0;
  let tax = 0;
  let shipping = 0;

  this.orders.forEach(order => {
    if (order.pricing) {
      subtotal += order.pricing.subtotal || 0;
      discount += order.pricing.discount || 0;
      tax += order.pricing.tax || 0;
      shipping += order.pricing.shipping || 0;
    }
  });

  this.pricing = {
    subtotal,
    discount,
    tax,
    shipping,
    total: subtotal - discount + tax + shipping
  };

  this.payment.pendingAmount = this.pricing.total - this.payment.collectedAmount;
};

// Check if user is member
groupOrderSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.toString() === userId.toString());
};

// Check if user is admin
groupOrderSchema.methods.isAdmin = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString() && member.role === 'admin'
  );
};

// Add member to group
groupOrderSchema.methods.addMember = function(userId, role = 'member') {
  if (!this.isMember(userId)) {
    this.members.push({
      user: userId,
      role: role,
      joinedAt: new Date()
    });
  }
};

// Remove member from group
groupOrderSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => 
    member.user.toString() !== userId.toString()
  );
};

// Check if group order is open for new orders
groupOrderSchema.virtual('isOpen').get(function() {
  return this.status === 'active' && 
         this.settings.deadline > new Date() &&
         this.settings.allowMemberOrders;
});

// Get member count
groupOrderSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Get order count
groupOrderSchema.virtual('orderCount').get(function() {
  return this.orders.length;
});

module.exports = mongoose.model('GroupOrder', groupOrderSchema);

