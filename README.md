# kpgeek511-Project-of-Trimester-3-IITG-x-MASAI

# Merchandise Portal Platform

A comprehensive merchandise ordering and distribution platform designed for campus, company, or organization use. This platform streamlines the process of ordering, reviewing, and distributing merchandise with support for individual and group-based ordering, secure payments, product reviews, and distribution tracking.

## Features

### Core Functionality
- **Product Catalog**: Browse and search merchandise with filtering and categorization
- **Individual Orders**: Place and track personal merchandise orders
- **Group Orders**: Coordinate bulk orders with departments, clubs, or societies
- **Secure Payments**: Integrated Razorpay payment gateway with multiple payment options
- **Product Reviews**: Open and closed review system for product feedback
- **Distribution Tracking**: Real-time tracking of order delivery and distribution
- **User Management**: Role-based access control (User, Department Head, Admin)
- **Profile Management**: User profiles with address and preference management

### Key Features
- **Responsive Design**: Modern, mobile-friendly UI/UX
- **Real-time Notifications**: Email and SMS notifications for orders and deliveries
- **Admin Dashboard**: Comprehensive analytics and management tools
- **Security**: SSL encryption, secure authentication, and data protection
- **Scalability**: Built to handle large volumes of orders and users

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** for database management
- **Session-based authentication** with secure session handling
- **Razorpay** payment gateway integration
- **Nodemailer** for email notifications
- **Twilio** for SMS notifications

### Frontend
- **HTML5** with semantic markup
- **CSS3** with modern styling and responsive design
- **Vanilla JavaScript** for interactive functionality
- **Font Awesome** icons for enhanced UI

### Security & Performance
- **Helmet.js** for security headers
- **Rate limiting** to prevent abuse
- **Input validation** and sanitization
- **Compression** for optimized performance
- **CORS** configuration for cross-origin requests

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Git

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd merchandise-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/merchandise-portal
   
   # Session Secret
   SESSION_SECRET=your-super-secret-session-key-here
   
   # Razorpay Configuration
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # SMS Configuration
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   
   # Environment
   NODE_ENV=development
   PORT=3000
   ```

4. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
merchandise-portal/
├── models/                 # Database models
│   ├── User.js
│   ├── Product.js
│   ├── Order.js
│   ├── GroupOrder.js
│   ├── Review.js
│   └── Distribution.js
├── routes/                 # API routes
│   ├── auth.js
│   ├── products.js
│   ├── orders.js
│   ├── payments.js
│   ├── reviews.js
│   ├── distribution.js
│   └── admin.js
├── middleware/             # Custom middleware
│   └── auth.js
├── public/                 # Frontend assets
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── app.js
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── reviews.js
│   │   └── utils.js
│   ├── images/
│   └── index.html
├── uploads/                # File uploads
│   ├── products/
│   └── reviews/
├── server.js              # Main server file
├── package.json
├── env.example
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/address` - Add address
- `PUT /api/auth/address/:id` - Update address
- `DELETE /api/auth/address/:id` - Delete address
- `PUT /api/auth/change-password` - Change password

### Products
- `GET /api/products` - Get all products (with filtering)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)
- `GET /api/products/categories/list` - Get categories
- `GET /api/products/featured/list` - Get featured products
- `GET /api/products/search/query` - Search products

### Orders
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create individual order
- `POST /api/orders/group` - Create group order
- `PUT /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/admin/all` - Get all orders (Admin/Dept Head)
- `PUT /api/orders/:id/status` - Update order status
- `GET /api/orders/admin/statistics` - Get order statistics

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/:orderId` - Get payment details
- `POST /api/payments/refund` - Process refund (Admin only)
- `GET /api/payments/admin/statistics` - Get payment statistics
- `POST /api/payments/webhook` - Razorpay webhook

### Reviews
- `GET /api/reviews/product/:productId` - Get product reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `POST /api/reviews/:id/helpful` - Mark review as helpful
- `DELETE /api/reviews/:id/helpful` - Unmark review as helpful
- `GET /api/reviews/my-reviews` - Get user's reviews
- `GET /api/reviews/admin/all` - Get all reviews (Admin only)
- `PUT /api/reviews/:id/status` - Update review status (Admin only)
- `GET /api/reviews/admin/statistics` - Get review statistics

### Distribution
- `GET /api/distribution/my-assignments` - Get user's distribution assignments
- `GET /api/distribution/:id` - Get single distribution
- `POST /api/distribution` - Create distribution assignment (Admin/Dept Head)
- `PUT /api/distribution/:id/status` - Update distribution status
- `PUT /api/distribution/:id/items/:itemId` - Update item status
- `PUT /api/distribution/:id/delivery-proof` - Add delivery proof
- `GET /api/distribution/admin/all` - Get all distributions (Admin/Dept Head)
- `GET /api/distribution/admin/statistics` - Get distribution statistics
- `PUT /api/distribution/:id/cancel` - Cancel distribution (Admin/Dept Head)

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - Get users (Admin only)
- `PUT /api/admin/users/:id/role` - Update user role (Admin only)
- `PUT /api/admin/users/:id/toggle-active` - Toggle user status (Admin only)
- `GET /api/admin/group-orders` - Get group orders (Admin only)
- `PUT /api/admin/group-orders/:id/status` - Update group order status (Admin only)
- `GET /api/admin/analytics` - Get analytics data (Admin only)
- `GET /api/admin/settings` - Get system settings (Admin only)
- `PUT /api/admin/settings` - Update system settings (Admin only)
- `GET /api/admin/export/:type` - Export data (Admin only)

## User Roles

### User
- Browse and search products
- Place individual orders
- Join group orders
- Write product reviews
- Track order status
- Manage profile and addresses

### Department Head
- All user permissions
- Create and manage group orders
- View department-specific analytics
- Manage distribution assignments
- Moderate reviews

### Admin
- All permissions
- Manage users and roles
- Manage products and categories
- View comprehensive analytics
- Manage system settings
- Export data
- Process refunds

## Security Features

- **Session-based Authentication**: Secure user sessions with MongoDB storage
- **Role-based Access Control**: Granular permissions based on user roles
- **Input Validation**: Comprehensive validation on all inputs
- **SQL Injection Prevention**: Parameterized queries and input sanitization
- **XSS Protection**: Content Security Policy and input escaping
- **Rate Limiting**: Protection against brute force attacks
- **Secure Headers**: Helmet.js for security headers
- **Password Hashing**: bcrypt for secure password storage

## Payment Integration

The platform integrates with Razorpay for secure payment processing:

- **Multiple Payment Methods**: Credit/Debit cards, UPI, Net Banking, Wallets
- **Secure Transactions**: PCI DSS compliant payment processing
- **Webhook Support**: Real-time payment status updates
- **Refund Management**: Automated and manual refund processing
- **Payment Analytics**: Comprehensive payment reporting

## Deployment

### Production Deployment

1. **Environment Setup**
   - Set `NODE_ENV=production`
   - Configure production MongoDB URI
   - Set up SSL certificates
   - Configure production email/SMS services

2. **Database Setup**
   - Create production MongoDB database
   - Set up database indexes for performance
   - Configure database backups

3. **Server Configuration**
   - Use PM2 for process management
   - Configure reverse proxy (Nginx)
   - Set up SSL termination
   - Configure file upload limits

4. **Monitoring**
   - Set up application monitoring
   - Configure error tracking
   - Set up performance monitoring
   - Configure log aggregation

### Recommended Hosting Platforms
- **Heroku**: Easy deployment with add-ons
- **DigitalOcean**: VPS with full control
- **AWS**: Scalable cloud infrastructure
- **Render**: Modern platform with automatic deployments

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Roadmap

### Phase 1 (Current)
- ✅ Core functionality implementation
- ✅ User authentication and management
- ✅ Product catalog and ordering
- ✅ Payment integration
- ✅ Review system
- ✅ Distribution tracking

### Phase 2 (Future)
- 🔄 Mobile app development
- 🔄 Advanced analytics dashboard
- 🔄 Inventory management
- 🔄 Automated notifications
- 🔄 Multi-language support
- 🔄 API rate limiting and caching

### Phase 3 (Future)
- 🔄 Machine learning recommendations
- 🔄 Advanced reporting
- 🔄 Integration with external systems
- 🔄 White-label solutions
- 🔄 Advanced security features

---

**Note**: This is a comprehensive merchandise portal platform designed for educational and organizational use. Ensure proper security measures and compliance with local regulations before deploying to production.

