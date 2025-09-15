const nodemailer = require('nodemailer');
const twilio = require('twilio');

class NotificationService {
    constructor() {
        this.emailTransporter = this.setupEmailTransporter();
        this.twilioClient = this.setupTwilioClient();
    }

    setupEmailTransporter() {
        return nodemailer.createTransporter({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    setupTwilioClient() {
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        }
        return null;
    }

    async sendEmail(to, subject, html, text = '') {
        try {
            const mailOptions = {
                from: `"Merchandise Portal" <${process.env.EMAIL_USER}>`,
                to: to,
                subject: subject,
                html: html,
                text: text || this.stripHtml(html)
            };

            const result = await this.emailTransporter.sendMail(mailOptions);
            console.log('Email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Email sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    async sendSMS(to, message) {
        try {
            if (!this.twilioClient) {
                console.log('Twilio not configured, SMS not sent');
                return { success: false, error: 'SMS service not configured' };
            }

            const result = await this.twilioClient.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: to
            });

            console.log('SMS sent successfully:', result.sid);
            return { success: true, messageId: result.sid };
        } catch (error) {
            console.error('SMS sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Order-related notifications
    async sendOrderConfirmation(order, user) {
        const subject = `Order Confirmation - ${order.orderNumber}`;
        const html = this.generateOrderConfirmationEmail(order, user);
        
        return await this.sendEmail(user.email, subject, html);
    }

    async sendOrderStatusUpdate(order, user, status) {
        const subject = `Order Update - ${order.orderNumber}`;
        const html = this.generateOrderStatusUpdateEmail(order, user, status);
        
        return await this.sendEmail(user.email, subject, html);
    }

    async sendPaymentConfirmation(order, user) {
        const subject = `Payment Confirmed - ${order.orderNumber}`;
        const html = this.generatePaymentConfirmationEmail(order, user);
        
        return await this.sendEmail(user.email, subject, html);
    }

    async sendOrderShippedNotification(order, user, trackingInfo) {
        const subject = `Your Order Has Shipped - ${order.orderNumber}`;
        const html = this.generateOrderShippedEmail(order, user, trackingInfo);
        
        return await this.sendEmail(user.email, subject, html);
    }

    async sendOrderDeliveredNotification(order, user) {
        const subject = `Order Delivered - ${order.orderNumber}`;
        const html = this.generateOrderDeliveredEmail(order, user);
        
        return await this.sendEmail(user.email, subject, html);
    }

    // Group order notifications
    async sendGroupOrderCreated(groupOrder, organizer) {
        const subject = `Group Order Created - ${groupOrder.name}`;
        const html = this.generateGroupOrderCreatedEmail(groupOrder, organizer);
        
        return await this.sendEmail(organizer.email, subject, html);
    }

    async sendGroupOrderDeadlineReminder(groupOrder, members) {
        const subject = `Group Order Deadline Reminder - ${groupOrder.name}`;
        const html = this.generateGroupOrderDeadlineReminderEmail(groupOrder);
        
        const emailPromises = members.map(member => 
            this.sendEmail(member.email, subject, html)
        );
        
        return await Promise.all(emailPromises);
    }

    async sendGroupOrderDistributionReminder(groupOrder, members) {
        const subject = `Group Order Distribution Reminder - ${groupOrder.name}`;
        const html = this.generateGroupOrderDistributionReminderEmail(groupOrder);
        
        const emailPromises = members.map(member => 
            this.sendEmail(member.email, subject, html)
        );
        
        return await Promise.all(emailPromises);
    }

    // Review notifications
    async sendReviewNotification(review, product, adminEmails) {
        const subject = `New Product Review - ${product.name}`;
        const html = this.generateReviewNotificationEmail(review, product);
        
        const emailPromises = adminEmails.map(email => 
            this.sendEmail(email, subject, html)
        );
        
        return await Promise.all(emailPromises);
    }

    // Distribution notifications
    async sendDistributionAssignment(distribution, assignedUser) {
        const subject = `New Distribution Assignment - ${distribution.order.orderNumber}`;
        const html = this.generateDistributionAssignmentEmail(distribution);
        
        return await this.sendEmail(assignedUser.email, subject, html);
    }

    async sendDistributionReady(distribution, assignedUser) {
        const subject = `Distribution Ready for Pickup - ${distribution.order.orderNumber}`;
        const html = this.generateDistributionReadyEmail(distribution);
        
        return await this.sendEmail(assignedUser.email, subject, html);
    }

    // Email templates
    generateOrderConfirmationEmail(order, user) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Order Confirmation</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f8fafc; }
                    .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
                    .total { font-weight: bold; font-size: 18px; color: #3b82f6; }
                    .footer { text-align: center; padding: 20px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Order Confirmation</h1>
                        <p>Thank you for your order, ${user.firstName}!</p>
                    </div>
                    <div class="content">
                        <h2>Order Details</h2>
                        <div class="order-details">
                            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                            <p><strong>Status:</strong> ${order.status}</p>
                            
                            <h3>Items Ordered:</h3>
                            ${order.items.map(item => `
                                <div class="item">
                                    <span>${item.product.name} x ${item.quantity}</span>
                                    <span>₹${item.totalPrice}</span>
                                </div>
                            `).join('')}
                            
                            <div class="item total">
                                <span>Total Amount:</span>
                                <span>₹${order.pricing.total}</span>
                            </div>
                        </div>
                        
                        <p>We'll send you another email when your order ships.</p>
                    </div>
                    <div class="footer">
                        <p>Thank you for choosing Merchandise Portal!</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generateOrderStatusUpdateEmail(order, user, status) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Order Status Update</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f8fafc; }
                    .status { background: #10b981; color: white; padding: 10px; border-radius: 5px; text-align: center; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Order Status Update</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${user.firstName},</p>
                        <p>Your order <strong>${order.orderNumber}</strong> status has been updated.</p>
                        
                        <div class="status">
                            <h2>${status.toUpperCase()}</h2>
                        </div>
                        
                        <p>You can track your order status by logging into your account.</p>
                    </div>
                    <div class="footer">
                        <p>Thank you for choosing Merchandise Portal!</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generatePaymentConfirmationEmail(order, user) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Payment Confirmed</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f8fafc; }
                    .payment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Payment Confirmed</h1>
                        <p>Your payment has been successfully processed!</p>
                    </div>
                    <div class="content">
                        <div class="payment-details">
                            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                            <p><strong>Payment Method:</strong> ${order.payment.method}</p>
                            <p><strong>Amount Paid:</strong> ₹${order.pricing.total}</p>
                            <p><strong>Payment Date:</strong> ${new Date(order.payment.paidAt).toLocaleDateString()}</p>
                        </div>
                        
                        <p>Your order is now being processed and will be shipped soon.</p>
                    </div>
                    <div class="footer">
                        <p>Thank you for choosing Merchandise Portal!</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generateOrderShippedEmail(order, user, trackingInfo) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Order Shipped</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f8fafc; }
                    .tracking { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Your Order Has Shipped!</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${user.firstName},</p>
                        <p>Great news! Your order <strong>${order.orderNumber}</strong> has been shipped.</p>
                        
                        <div class="tracking">
                            <h3>Tracking Information</h3>
                            <p><strong>Tracking Number:</strong> ${trackingInfo.trackingNumber || 'N/A'}</p>
                            <p><strong>Carrier:</strong> ${trackingInfo.carrier || 'N/A'}</p>
                            <p><strong>Estimated Delivery:</strong> ${trackingInfo.estimatedDelivery ? new Date(trackingInfo.estimatedDelivery).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        
                        <p>You can track your package using the tracking number above.</p>
                    </div>
                    <div class="footer">
                        <p>Thank you for choosing Merchandise Portal!</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generateOrderDeliveredEmail(order, user) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Order Delivered</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f8fafc; }
                    .footer { text-align: center; padding: 20px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Order Delivered Successfully!</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${user.firstName},</p>
                        <p>Your order <strong>${order.orderNumber}</strong> has been delivered successfully!</p>
                        
                        <p>We hope you enjoy your purchase. If you have any questions or concerns, please don't hesitate to contact us.</p>
                        
                        <p>We'd love to hear about your experience! Please consider leaving a review for the products you purchased.</p>
                    </div>
                    <div class="footer">
                        <p>Thank you for choosing Merchandise Portal!</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generateGroupOrderCreatedEmail(groupOrder, organizer) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Group Order Created</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f8fafc; }
                    .group-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Group Order Created Successfully!</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${organizer.firstName},</p>
                        <p>Your group order has been created successfully.</p>
                        
                        <div class="group-details">
                            <h3>Group Order Details</h3>
                            <p><strong>Name:</strong> ${groupOrder.name}</p>
                            <p><strong>Department:</strong> ${groupOrder.department}</p>
                            <p><strong>Deadline:</strong> ${new Date(groupOrder.settings.deadline).toLocaleDateString()}</p>
                            <p><strong>Distribution Date:</strong> ${groupOrder.settings.distributionDate ? new Date(groupOrder.settings.distributionDate).toLocaleDateString() : 'TBD'}</p>
                        </div>
                        
                        <p>Share the group order link with your team members so they can join and place their orders.</p>
                    </div>
                    <div class="footer">
                        <p>Thank you for choosing Merchandise Portal!</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generateGroupOrderDeadlineReminderEmail(groupOrder) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Group Order Deadline Reminder</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f8fafc; }
                    .deadline { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                    .footer { text-align: center; padding: 20px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Group Order Deadline Reminder</h1>
                    </div>
                    <div class="content">
                        <p>This is a reminder that your group order deadline is approaching.</p>
                        
                        <div class="deadline">
                            <h3>Group Order: ${groupOrder.name}</h3>
                            <p><strong>Deadline:</strong> ${new Date(groupOrder.settings.deadline).toLocaleDateString()}</p>
                            <p><strong>Department:</strong> ${groupOrder.department}</p>
                        </div>
                        
                        <p>Please make sure to place your order before the deadline. After the deadline, no new orders will be accepted for this group order.</p>
                    </div>
                    <div class="footer">
                        <p>Thank you for choosing Merchandise Portal!</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generateGroupOrderDistributionReminderEmail(groupOrder) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Group Order Distribution Reminder</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f8fafc; }
                    .distribution { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Group Order Distribution Reminder</h1>
                    </div>
                    <div class="content">
                        <p>Your group order is ready for distribution!</p>
                        
                        <div class="distribution">
                            <h3>Group Order: ${groupOrder.name}</h3>
                            <p><strong>Distribution Date:</strong> ${new Date(groupOrder.settings.distributionDate).toLocaleDateString()}</p>
                            <p><strong>Location:</strong> ${groupOrder.settings.distributionLocation || 'TBD'}</p>
                            <p><strong>Department:</strong> ${groupOrder.department}</p>
                        </div>
                        
                        <p>Please make sure to collect your order on the specified date and location.</p>
                    </div>
                    <div class="footer">
                        <p>Thank you for choosing Merchandise Portal!</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generateReviewNotificationEmail(review, product) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>New Product Review</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f8fafc; }
                    .review { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>New Product Review</h1>
                    </div>
                    <div class="content">
                        <p>A new review has been submitted for a product.</p>
                        
                        <div class="review">
                            <h3>Product: ${product.name}</h3>
                            <p><strong>Rating:</strong> ${review.rating}/5 stars</p>
                            <p><strong>Review:</strong> ${review.comment}</p>
                            <p><strong>Visibility:</strong> ${review.visibility}</p>
                        </div>
                        
                        <p>Please review and moderate this review in the admin panel.</p>
                    </div>
                    <div class="footer">
                        <p>Merchandise Portal Admin</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generateDistributionAssignmentEmail(distribution) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Distribution Assignment</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f8fafc; }
                    .assignment { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>New Distribution Assignment</h1>
                    </div>
                    <div class="content">
                        <p>You have been assigned a new distribution task.</p>
                        
                        <div class="assignment">
                            <h3>Distribution Details</h3>
                            <p><strong>Order Number:</strong> ${distribution.order.orderNumber}</p>
                            <p><strong>Location:</strong> ${distribution.location.name}</p>
                            <p><strong>Scheduled Date:</strong> ${new Date(distribution.scheduledDate).toLocaleDateString()}</p>
                            <p><strong>Status:</strong> ${distribution.status}</p>
                        </div>
                        
                        <p>Please log into the system to view full details and update the status as needed.</p>
                    </div>
                    <div class="footer">
                        <p>Merchandise Portal</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generateDistributionReadyEmail(distribution) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Distribution Ready</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f8fafc; }
                    .ready { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Distribution Ready for Pickup</h1>
                    </div>
                    <div class="content">
                        <p>The distribution you're assigned to is ready for pickup.</p>
                        
                        <div class="ready">
                            <h3>Distribution Details</h3>
                            <p><strong>Order Number:</strong> ${distribution.order.orderNumber}</p>
                            <p><strong>Location:</strong> ${distribution.location.name}</p>
                            <p><strong>Status:</strong> ${distribution.status}</p>
                        </div>
                        
                        <p>Please proceed to the location to complete the distribution.</p>
                    </div>
                    <div class="footer">
                        <p>Merchandise Portal</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    stripHtml(html) {
        return html.replace(/<[^>]*>/g, '');
    }
}

module.exports = new NotificationService();

