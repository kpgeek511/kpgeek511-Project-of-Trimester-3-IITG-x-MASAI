const mongoose = require('mongoose');
const Product = require('./models/Product');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/merchandise-portal', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testProducts() {
  try {
    console.log('Testing products...');
    
    // Get all products
    const products = await Product.find({ isActive: true }).limit(5);
    console.log(`Found ${products.length} products:`);
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - ₹${product.price} (${product.category})`);
    });
    
    // Test the API endpoint logic
    const filter = { isActive: true };
    const productsWithFilter = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    
    console.log('\nAPI Test Results:');
    console.log(`Products returned: ${productsWithFilter.length}`);
    
    if (productsWithFilter.length > 0) {
      console.log('Sample product:', {
        name: productsWithFilter[0].name,
        category: productsWithFilter[0].category,
        price: productsWithFilter[0].price
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

testProducts();


