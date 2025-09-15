const mongoose = require('mongoose');

const distributionSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  groupOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupOrder',
    default: null
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    contactPerson: {
      name: String,
      phone: String,
      email: String
    }
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  actualDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'ready', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  tracking: {
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    notes: String
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    status: {
      type: String,
      enum: ['pending', 'packed', 'shipped', 'delivered'],
      default: 'pending'
    },
    notes: String
  }],
  deliveryProof: {
    signature: String,
    image: String,
    deliveredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    receivedBy: {
      name: String,
      phone: String,
      signature: String
    }
  },
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  notifications: {
    assigned: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    },
    ready: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    },
    delivered: {
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

// Add status to timeline when status changes
distributionSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      note: `Distribution status changed to ${this.status}`
    });
  }
  next();
});

// Generate tracking number
distributionSchema.pre('save', function(next) {
  if (!this.tracking.trackingNumber && this.status === 'in_transit') {
    const prefix = 'TRK';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.tracking.trackingNumber = `${prefix}-${timestamp}-${random}`;
  }
  next();
});

// Check if distribution can be cancelled
distributionSchema.virtual('canCancel').get(function() {
  return ['pending', 'assigned', 'ready'].includes(this.status);
});

// Check if distribution is overdue
distributionSchema.virtual('isOverdue').get(function() {
  return this.scheduledDate < new Date() && !['delivered', 'cancelled'].includes(this.status);
});

// Get days until scheduled delivery
distributionSchema.virtual('daysUntilDelivery').get(function() {
  const now = new Date();
  const scheduled = new Date(this.scheduledDate);
  const diffTime = scheduled - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Static method to get distribution statistics
distributionSchema.statics.getStatistics = async function(startDate, endDate) {
  const matchStage = {
    isActive: true
  };

  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    pending: 0,
    assigned: 0,
    ready: 0,
    in_transit: 0,
    delivered: 0,
    cancelled: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
  });

  return result;
};

// Static method to get overdue distributions
distributionSchema.statics.getOverdue = async function() {
  return this.find({
    status: { $in: ['pending', 'assigned', 'ready'] },
    scheduledDate: { $lt: new Date() },
    isActive: true
  }).populate('order user assignedTo');
};

module.exports = mongoose.model('Distribution', distributionSchema);

