# Deployment Guide

This guide will help you deploy the Merchandise Portal Platform to various hosting platforms.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Git
- Domain name (optional)
- SSL certificate (for production)

## Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd merchandise-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your production values:
   ```env
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=mongodb://your-mongodb-connection-string
   SESSION_SECRET=your-super-secure-session-secret
   RAZORPAY_KEY_ID=your-razorpay-key-id
   RAZORPAY_KEY_SECRET=your-razorpay-key-secret
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=your-twilio-phone-number
   ```

## Deployment Options

### Option 1: Heroku

1. **Install Heroku CLI**
   ```bash
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```

4. **Add MongoDB addon**
   ```bash
   heroku addons:create mongolab:sandbox
   ```

5. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set SESSION_SECRET=your-session-secret
   heroku config:set RAZORPAY_KEY_ID=your-razorpay-key-id
   heroku config:set RAZORPAY_KEY_SECRET=your-razorpay-key-secret
   # Add other environment variables
   ```

6. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

7. **Open the app**
   ```bash
   heroku open
   ```

### Option 2: DigitalOcean

1. **Create a Droplet**
   - Choose Ubuntu 20.04 LTS
   - Select appropriate size (2GB RAM minimum)
   - Add SSH key

2. **Connect to your Droplet**
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Update system**
   ```bash
   apt update && apt upgrade -y
   ```

4. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   apt-get install -y nodejs
   ```

5. **Install MongoDB**
   ```bash
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   apt-get update
   apt-get install -y mongodb-org
   systemctl start mongod
   systemctl enable mongod
   ```

6. **Install PM2**
   ```bash
   npm install -g pm2
   ```

7. **Clone and setup your app**
   ```bash
   git clone <your-repo-url>
   cd merchandise-portal
   npm install --production
   cp env.example .env
   # Edit .env with your production values
   ```

8. **Start the application**
   ```bash
   pm2 start server.js --name "merchandise-portal"
   pm2 save
   pm2 startup
   ```

9. **Setup Nginx (optional)**
   ```bash
   apt install nginx
   # Configure nginx for your domain
   systemctl start nginx
   systemctl enable nginx
   ```

### Option 3: AWS EC2

1. **Launch EC2 Instance**
   - Choose Amazon Linux 2 or Ubuntu
   - Select t2.micro (free tier) or larger
   - Configure security groups (ports 22, 80, 443, 3000)

2. **Connect to instance**
   ```bash
   ssh -i your-key.pem ec2-user@your-instance-ip
   ```

3. **Install Node.js**
   ```bash
   # For Amazon Linux 2
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   nvm install 18
   nvm use 18
   ```

4. **Install MongoDB**
   ```bash
   # Create MongoDB repository
   sudo vim /etc/yum.repos.d/mongodb-org-6.0.repo
   # Add MongoDB repository configuration
   sudo yum install -y mongodb-org
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

5. **Deploy your application**
   ```bash
   git clone <your-repo-url>
   cd merchandise-portal
   npm install --production
   cp env.example .env
   # Configure .env file
   ```

6. **Install PM2 and start app**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "merchandise-portal"
   pm2 save
   pm2 startup
   ```

### Option 4: Docker Deployment

1. **Build Docker image**
   ```bash
   docker build -t merchandise-portal .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Or run individual containers**
   ```bash
   # Start MongoDB
   docker run -d --name mongodb -p 27017:27017 mongo:6.0
   
   # Start application
   docker run -d --name app --link mongodb -p 3000:3000 \
     -e MONGODB_URI=mongodb://mongodb:27017/merchandise-portal \
     merchandise-portal
   ```

## Database Setup

1. **Connect to MongoDB**
   ```bash
   mongo
   ```

2. **Create database and user**
   ```javascript
   use merchandise-portal
   db.createUser({
     user: "admin",
     pwd: "password",
     roles: ["readWrite"]
   })
   ```

3. **Create indexes for performance**
   ```javascript
   db.products.createIndex({ "name": "text", "description": "text" })
   db.products.createIndex({ "category": 1 })
   db.products.createIndex({ "price": 1 })
   db.orders.createIndex({ "user": 1 })
   db.orders.createIndex({ "status": 1 })
   db.orders.createIndex({ "createdAt": -1 })
   ```

## SSL Certificate Setup

### Using Let's Encrypt (Free)

1. **Install Certbot**
   ```bash
   # Ubuntu/Debian
   apt install certbot python3-certbot-nginx
   
   # CentOS/RHEL
   yum install certbot python3-certbot-nginx
   ```

2. **Obtain certificate**
   ```bash
   certbot --nginx -d yourdomain.com
   ```

3. **Auto-renewal**
   ```bash
   crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

## Monitoring and Maintenance

### PM2 Monitoring

```bash
# View running processes
pm2 list

# View logs
pm2 logs merchandise-portal

# Restart application
pm2 restart merchandise-portal

# Stop application
pm2 stop merchandise-portal

# Monitor resources
pm2 monit
```

### Database Backup

```bash
# Create backup
mongodump --db merchandise-portal --out /backup/$(date +%Y%m%d)

# Restore backup
mongorestore --db merchandise-portal /backup/20240101/merchandise-portal
```

### Log Management

```bash
# View application logs
pm2 logs merchandise-portal --lines 100

# Rotate logs
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## Security Considerations

1. **Firewall Configuration**
   ```bash
   # Ubuntu/Debian
   ufw allow 22
   ufw allow 80
   ufw allow 443
   ufw enable
   ```

2. **Regular Updates**
   ```bash
   # Update system packages
   apt update && apt upgrade -y
   
   # Update Node.js dependencies
   npm audit fix
   ```

3. **Environment Variables**
   - Never commit `.env` files
   - Use strong, unique secrets
   - Rotate secrets regularly

4. **Database Security**
   - Use strong passwords
   - Enable authentication
   - Restrict network access
   - Regular backups

## Performance Optimization

1. **Enable Gzip Compression**
   ```javascript
   // Already included in server.js
   app.use(compression());
   ```

2. **Database Indexing**
   - Create indexes on frequently queried fields
   - Monitor query performance

3. **Caching**
   - Implement Redis for session storage
   - Cache frequently accessed data

4. **CDN**
   - Use CloudFlare or AWS CloudFront
   - Serve static assets from CDN

## Troubleshooting

### Common Issues

1. **Application won't start**
   ```bash
   # Check logs
   pm2 logs merchandise-portal
   
   # Check environment variables
   pm2 env 0
   ```

2. **Database connection issues**
   ```bash
   # Check MongoDB status
   systemctl status mongod
   
   # Check connection string
   echo $MONGODB_URI
   ```

3. **Port already in use**
   ```bash
   # Find process using port
   lsof -i :3000
   
   # Kill process
   kill -9 <PID>
   ```

### Health Checks

1. **Application health**
   ```bash
   curl http://localhost:3000/api/products
   ```

2. **Database health**
   ```bash
   mongo --eval "db.adminCommand('ping')"
   ```

## Scaling

### Horizontal Scaling

1. **Load Balancer**
   - Use Nginx or HAProxy
   - Distribute traffic across multiple instances

2. **Database Clustering**
   - MongoDB replica set
   - Read/write splitting

3. **Session Management**
   - Use Redis for session storage
   - Sticky sessions or session sharing

### Vertical Scaling

1. **Increase Server Resources**
   - More CPU cores
   - More RAM
   - Faster storage (SSD)

2. **Database Optimization**
   - Increase MongoDB memory
   - Optimize queries
   - Add more indexes

## Backup Strategy

1. **Database Backups**
   ```bash
   # Daily backup script
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   mongodump --db merchandise-portal --out /backup/$DATE
   tar -czf /backup/merchandise-portal_$DATE.tar.gz /backup/$DATE
   rm -rf /backup/$DATE
   ```

2. **File Backups**
   ```bash
   # Backup uploads directory
   tar -czf /backup/uploads_$(date +%Y%m%d).tar.gz /path/to/uploads
   ```

3. **Automated Backups**
   ```bash
   # Add to crontab
   0 2 * * * /path/to/backup-script.sh
   ```

## Support and Maintenance

1. **Regular Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Test updates in staging

2. **Monitoring**
   - Set up application monitoring
   - Monitor server resources
   - Set up alerts

3. **Documentation**
   - Keep deployment docs updated
   - Document any custom configurations
   - Maintain runbooks

---

For additional support or questions, please refer to the main README.md file or create an issue in the repository.

