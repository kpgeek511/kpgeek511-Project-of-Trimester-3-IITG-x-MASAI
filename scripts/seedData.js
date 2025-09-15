const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/merchandise-portal', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const sampleProducts = [
  // Clothing & Apparel
  {
    name: "Campus T-Shirt",
    description: "Comfortable cotton t-shirt with campus logo embroidered on the chest. Perfect for casual wear and campus events.",
    shortDescription: "Comfortable cotton t-shirt with campus logo",
    category: "apparel",
    price: 299,
    originalPrice: 399,
    discount: 25,
    stock: 100,
    images: [{
      url: "/images/apparel.svg",
      alt: "Campus T-Shirt",
      isPrimary: true
    }],
    tags: ["apparel", "campus", "cotton", "casual"],
    specifications: {
      material: "100% Cotton",
      careInstructions: "Machine wash cold",
      sizes: "S, M, L, XL, XXL",
      color: "Navy Blue"
    },
    isActive: true,
    isFeatured: true
  },
  {
    name: "Campus Hoodie",
    description: "Warm and cozy hoodie perfect for campus life. Features kangaroo pocket and drawstring hood.",
    shortDescription: "Warm and cozy hoodie with campus branding",
    category: "apparel",
    price: 799,
    originalPrice: 999,
    discount: 20,
    stock: 50,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Hoodie",
      isPrimary: true
    }],
    tags: ["apparel", "campus", "hoodie", "warm"],
    specifications: {
      material: "80% Cotton, 20% Polyester",
      careInstructions: "Machine wash cold",
      sizes: "S, M, L, XL, XXL",
      color: "Charcoal Gray"
    },
    isActive: true,
    isFeatured: true
  },
  {
    name: "Campus Polo Shirt",
    description: "Classic polo shirt with campus logo. Perfect for formal campus events and presentations.",
    shortDescription: "Classic polo shirt with campus logo",
    category: "apparel",
    price: 449,
    originalPrice: 599,
    discount: 25,
    stock: 75,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Polo Shirt",
      isPrimary: true
    }],
    tags: ["apparel", "campus", "polo", "formal"],
    specifications: {
      material: "100% Pique Cotton",
      careInstructions: "Machine wash cold",
      sizes: "S, M, L, XL, XXL",
      color: "White"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Cap",
    description: "Adjustable baseball cap with campus logo. UV protection and breathable fabric.",
    shortDescription: "Adjustable baseball cap with campus logo",
    category: "apparel",
    price: 199,
    stock: 120,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Cap",
      isPrimary: true
    }],
    tags: ["apparel", "campus", "cap", "accessory"],
    specifications: {
      material: "100% Cotton",
      features: "Adjustable strap, UV protection",
      color: "Navy Blue"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Sweatshirt",
    description: "Comfortable crewneck sweatshirt with campus logo. Perfect for layering in cooler weather.",
    shortDescription: "Comfortable crewneck sweatshirt",
    category: "apparel",
    price: 599,
    originalPrice: 749,
    discount: 20,
    stock: 80,
    images: [{
      url: "/images/apparel.svg",
      alt: "Campus Sweatshirt",
      isPrimary: true
    }],
    tags: ["apparel", "campus", "sweatshirt", "comfortable"],
    specifications: {
      material: "50% Cotton, 50% Polyester",
      careInstructions: "Machine wash cold",
      sizes: "S, M, L, XL, XXL",
      color: "Heather Gray"
    },
    isActive: true,
    isFeatured: true
  },

  // Accessories
  {
    name: "Campus Mug",
    description: "Ceramic mug with campus branding. Perfect for your morning coffee or tea.",
    shortDescription: "Ceramic mug with campus branding",
    category: "accessories",
    price: 199,
    stock: 200,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Mug",
      isPrimary: true
    }],
    tags: ["accessories", "campus", "mug", "ceramic"],
    specifications: {
      material: "Ceramic",
      capacity: "350ml",
      features: "Dishwasher safe, microwave safe"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Water Bottle",
    description: "Insulated stainless steel water bottle with campus logo. Keeps drinks cold for 24 hours.",
    shortDescription: "Insulated stainless steel water bottle",
    category: "accessories",
    price: 399,
    originalPrice: 499,
    discount: 20,
    stock: 150,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Water Bottle",
      isPrimary: true
    }],
    tags: ["accessories", "campus", "water bottle", "insulated"],
    specifications: {
      material: "Stainless Steel",
      capacity: "500ml",
      features: "Insulated, leak-proof, BPA-free"
    },
    isActive: true,
    isFeatured: true
  },
  {
    name: "Campus Keychain",
    description: "Metal keychain with campus logo. Durable and lightweight design.",
    shortDescription: "Metal keychain with campus logo",
    category: "accessories",
    price: 49,
    stock: 500,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Keychain",
      isPrimary: true
    }],
    tags: ["accessories", "campus", "keychain", "metal"],
    specifications: {
      material: "Brass",
      features: "Durable, lightweight",
      color: "Gold"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Laptop Sticker Pack",
    description: "Set of 5 vinyl stickers with campus branding. Perfect for personalizing your laptop.",
    shortDescription: "Set of 5 vinyl stickers with campus branding",
    category: "accessories",
    price: 99,
    stock: 300,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Laptop Sticker Pack",
      isPrimary: true
    }],
    tags: ["accessories", "campus", "stickers", "laptop"],
    specifications: {
      material: "Vinyl",
      quantity: "5 stickers",
      features: "Waterproof, removable"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Tote Bag",
    description: "Canvas tote bag with campus logo. Perfect for carrying books and campus essentials.",
    shortDescription: "Canvas tote bag with campus logo",
    category: "accessories",
    price: 249,
    stock: 100,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Tote Bag",
      isPrimary: true
    }],
    tags: ["accessories", "campus", "tote bag", "canvas"],
    specifications: {
      material: "Canvas",
      dimensions: "40cm x 35cm",
      features: "Reinforced handles, machine washable"
    },
    isActive: true,
    isFeatured: false
  },

  // Stationery
  {
    name: "Campus Notebook",
    description: "Spiral bound notebook with campus logo. 200 pages of lined paper for all your notes.",
    shortDescription: "Spiral bound notebook with campus logo",
    category: "stationery",
    price: 149,
    stock: 150,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Notebook",
      isPrimary: true
    }],
    tags: ["stationery", "campus", "notebook", "spiral"],
    specifications: {
      pages: "200 pages",
      size: "A5",
      paper: "Lined paper",
      binding: "Spiral bound"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Pen Set",
    description: "Set of 3 branded pens in different colors. Smooth writing experience.",
    shortDescription: "Set of 3 branded pens",
    category: "stationery",
    price: 99,
    stock: 300,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Pen Set",
      isPrimary: true
    }],
    tags: ["stationery", "campus", "pens", "set"],
    specifications: {
      type: "Ballpoint",
      colors: "Blue, Black, Red",
      quantity: "3 pens"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Highlighter Set",
    description: "Set of 4 highlighters in different colors. Perfect for studying and note-taking.",
    shortDescription: "Set of 4 highlighters in different colors",
    category: "stationery",
    price: 129,
    stock: 200,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Highlighter Set",
      isPrimary: true
    }],
    tags: ["stationery", "campus", "highlighters", "study"],
    specifications: {
      type: "Fluorescent",
      colors: "Yellow, Green, Pink, Blue",
      quantity: "4 highlighters"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Pencil Case",
    description: "Zippered pencil case with campus logo. Holds all your stationery essentials.",
    shortDescription: "Zippered pencil case with campus logo",
    category: "stationery",
    price: 179,
    stock: 100,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Pencil Case",
      isPrimary: true
    }],
    tags: ["stationery", "campus", "pencil case", "zippered"],
    specifications: {
      material: "Polyester",
      features: "Zippered closure, multiple compartments",
      dimensions: "20cm x 8cm x 4cm"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Sticky Notes",
    description: "Pack of 5 sticky note pads with campus logo. Perfect for reminders and notes.",
    shortDescription: "Pack of 5 sticky note pads",
    category: "stationery",
    price: 79,
    stock: 250,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Sticky Notes",
      isPrimary: true
    }],
    tags: ["stationery", "campus", "sticky notes", "reminders"],
    specifications: {
      quantity: "5 pads",
      size: "7.5cm x 7.5cm",
      color: "Yellow"
    },
    isActive: true,
    isFeatured: false
  },

  // Electronics
  {
    name: "Campus USB Drive",
    description: "32GB USB drive with campus logo. High-speed data transfer and reliable storage.",
    shortDescription: "32GB USB drive with campus logo",
    category: "electronics",
    price: 599,
    originalPrice: 799,
    discount: 25,
    stock: 80,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus USB Drive",
      isPrimary: true
    }],
    tags: ["electronics", "campus", "usb", "storage"],
    specifications: {
      capacity: "32GB",
      interface: "USB 3.0",
      features: "Plug and play, password protection"
    },
    isActive: true,
    isFeatured: true
  },
  {
    name: "Campus Phone Case",
    description: "Protective phone case with campus logo. Compatible with most smartphone models.",
    shortDescription: "Protective phone case with campus logo",
    category: "electronics",
    price: 299,
    stock: 120,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Phone Case",
      isPrimary: true
    }],
    tags: ["electronics", "campus", "phone case", "protective"],
    specifications: {
      material: "Silicone",
      features: "Shock absorption, precise cutouts",
      compatibility: "Universal fit"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Power Bank",
    description: "10000mAh power bank with campus logo. Fast charging and compact design.",
    shortDescription: "10000mAh power bank with campus logo",
    category: "electronics",
    price: 899,
    originalPrice: 1199,
    discount: 25,
    stock: 60,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Power Bank",
      isPrimary: true
    }],
    tags: ["electronics", "campus", "power bank", "charging"],
    specifications: {
      capacity: "10000mAh",
      output: "5V/2A",
      features: "Fast charging, LED indicator"
    },
    isActive: true,
    isFeatured: true
  },

  // Books & Academic
  {
    name: "Campus Academic Planner",
    description: "2024 academic planner with campus branding. Perfect for organizing your academic year.",
    shortDescription: "2024 academic planner with campus branding",
    category: "books",
    price: 349,
    stock: 100,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Academic Planner",
      isPrimary: true
    }],
    tags: ["books", "campus", "planner", "academic"],
    specifications: {
      year: "2024",
      pages: "365 pages",
      features: "Monthly and weekly views, goal tracking"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Study Guide",
    description: "Comprehensive study guide with campus-specific content and tips for academic success.",
    shortDescription: "Comprehensive study guide for academic success",
    category: "books",
    price: 199,
    stock: 150,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Study Guide",
      isPrimary: true
    }],
    tags: ["books", "campus", "study guide", "academic"],
    specifications: {
      pages: "150 pages",
      format: "Paperback",
      language: "English"
    },
    isActive: true,
    isFeatured: false
  },

  // Sports & Fitness
  {
    name: "Campus Gym Towel",
    description: "Microfiber gym towel with campus logo. Quick-drying and lightweight.",
    shortDescription: "Microfiber gym towel with campus logo",
    category: "sports",
    price: 149,
    stock: 100,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Gym Towel",
      isPrimary: true
    }],
    tags: ["sports", "campus", "gym towel", "microfiber"],
    specifications: {
      material: "Microfiber",
      size: "60cm x 30cm",
      features: "Quick-drying, lightweight"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Sports Bottle",
    description: "BPA-free sports bottle with campus logo. Perfect for workouts and sports activities.",
    shortDescription: "BPA-free sports bottle with campus logo",
    category: "sports",
    price: 249,
    stock: 120,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Sports Bottle",
      isPrimary: true
    }],
    tags: ["sports", "campus", "sports bottle", "BPA-free"],
    specifications: {
      material: "BPA-free plastic",
      capacity: "750ml",
      features: "Leak-proof, easy to clean"
    },
    isActive: true,
    isFeatured: false
  },

  // Gifts & Souvenirs
  {
    name: "Campus Photo Frame",
    description: "Wooden photo frame with campus logo. Perfect for displaying campus memories.",
    shortDescription: "Wooden photo frame with campus logo",
    category: "gifts",
    price: 199,
    stock: 80,
    images: [{
      url: "/images/gifts.svg",
      alt: "Campus Photo Frame",
      isPrimary: true
    }],
    tags: ["gifts", "campus", "photo frame", "wooden"],
    specifications: {
      material: "Wood",
      size: "15cm x 10cm",
      features: "Glass front, stand included"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Key Ring",
    description: "Leather key ring with campus logo. Durable and stylish design.",
    shortDescription: "Leather key ring with campus logo",
    category: "gifts",
    price: 79,
    stock: 200,
    images: [{
      url: "/images/gifts.svg",
      alt: "Campus Key Ring",
      isPrimary: true
    }],
    tags: ["gifts", "campus", "key ring", "leather"],
    specifications: {
      material: "Genuine Leather",
      features: "Durable, stylish",
      color: "Brown"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Backpack",
    description: "Spacious backpack with laptop compartment and campus branding. Perfect for students.",
    shortDescription: "Spacious backpack with laptop compartment",
    category: "accessories",
    price: 1299,
    originalPrice: 1599,
    discount: 19,
    stock: 60,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Backpack",
      isPrimary: true
    }],
    tags: ["accessories", "campus", "backpack", "laptop"],
    specifications: {
      material: "Nylon",
      capacity: "25L",
      features: "Laptop compartment, water bottle holder, multiple pockets"
    },
    isActive: true,
    isFeatured: true
  },
  {
    name: "Campus Mouse Pad",
    description: "Gaming mouse pad with campus logo. Smooth surface for precise mouse movement.",
    shortDescription: "Gaming mouse pad with campus logo",
    category: "electronics",
    price: 149,
    stock: 100,
    images: [{
      url: "/images/electronics.svg",
      alt: "Campus Mouse Pad",
      isPrimary: true
    }],
    tags: ["electronics", "campus", "mouse pad", "gaming"],
    specifications: {
      material: "Rubber base, cloth surface",
      size: "25cm x 20cm",
      features: "Non-slip base, washable"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Desk Organizer",
    description: "Multi-compartment desk organizer with campus branding. Keep your workspace tidy.",
    shortDescription: "Multi-compartment desk organizer",
    category: "stationery",
    price: 299,
    originalPrice: 399,
    discount: 25,
    stock: 75,
    images: [{
      url: "/images/stationery.svg",
      alt: "Campus Desk Organizer",
      isPrimary: true
    }],
    tags: ["stationery", "campus", "organizer", "desk"],
    specifications: {
      material: "Plastic",
      compartments: "6 compartments",
      features: "Removable dividers, easy to clean"
    },
    isActive: true,
    isFeatured: true
  },
  {
    name: "Campus Yoga Mat",
    description: "Non-slip yoga mat with campus logo. Perfect for fitness and wellness activities.",
    shortDescription: "Non-slip yoga mat with campus logo",
    category: "sports",
    price: 899,
    originalPrice: 1199,
    discount: 25,
    stock: 40,
    images: [{
      url: "/images/sports.svg",
      alt: "Campus Yoga Mat",
      isPrimary: true
    }],
    tags: ["sports", "campus", "yoga mat", "fitness"],
    specifications: {
      material: "TPE (Thermoplastic Elastomer)",
      size: "183cm x 61cm x 6mm",
      features: "Non-slip, lightweight, easy to clean"
    },
    isActive: true,
    isFeatured: true
  },
  {
    name: "Campus Study Lamp",
    description: "LED study lamp with adjustable brightness and campus logo. Perfect for late-night studying.",
    shortDescription: "LED study lamp with adjustable brightness",
    category: "electronics",
    price: 799,
    originalPrice: 999,
    discount: 20,
    stock: 50,
    images: [{
      url: "/images/electronics.svg",
      alt: "Campus Study Lamp",
      isPrimary: true
    }],
    tags: ["electronics", "campus", "study lamp", "LED"],
    specifications: {
      material: "Aluminum, LED",
      brightness: "3 levels",
      features: "USB charging port, adjustable arm, eye-friendly light"
    },
    isActive: true,
    isFeatured: true
  },
  {
    name: "Campus Calculator",
    description: "Scientific calculator with campus logo. Essential for engineering and science students.",
    shortDescription: "Scientific calculator with campus logo",
    category: "electronics",
    price: 399,
    stock: 120,
    images: [{
      url: "/images/electronics.svg",
      alt: "Campus Calculator",
      isPrimary: true
    }],
    tags: ["electronics", "campus", "calculator", "scientific"],
    specifications: {
      type: "Scientific Calculator",
      functions: "300+ functions",
      features: "Solar + battery powered, protective case included"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Water Bottle",
    description: "Insulated stainless steel water bottle with campus logo. Keep your drinks hot or cold for hours.",
    shortDescription: "Insulated stainless steel water bottle",
    category: "accessories",
    price: 449,
    originalPrice: 599,
    discount: 25,
    stock: 80,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Water Bottle",
      isPrimary: true
    }],
    tags: ["accessories", "campus", "water bottle", "insulated"],
    specifications: {
      material: "Stainless Steel",
      capacity: "500ml",
      features: "Insulated, leak-proof, BPA-free"
    },
    isActive: true,
    isFeatured: true
  },
  {
    name: "Campus Laptop Sticker Pack",
    description: "Set of 10 vinyl stickers with campus logo and mascot. Perfect for personalizing your laptop.",
    shortDescription: "Set of 10 vinyl stickers with campus logo",
    category: "accessories",
    price: 99,
    stock: 150,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Laptop Sticker Pack",
      isPrimary: true
    }],
    tags: ["accessories", "campus", "stickers", "laptop"],
    specifications: {
      material: "Vinyl",
      quantity: "10 stickers",
      features: "Waterproof, removable, various designs"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Pen Set",
    description: "Premium ballpoint pen set with campus logo. Includes 3 pens in different colors.",
    shortDescription: "Premium ballpoint pen set with campus logo",
    category: "stationery",
    price: 199,
    originalPrice: 249,
    discount: 20,
    stock: 100,
    images: [{
      url: "/images/stationery.svg",
      alt: "Campus Pen Set",
      isPrimary: true
    }],
    tags: ["stationery", "campus", "pens", "ballpoint"],
    specifications: {
      material: "Metal body",
      quantity: "3 pens",
      features: "Smooth writing, refillable, gift box included"
    },
    isActive: true,
    isFeatured: true
  },
  {
    name: "Campus Notebook Set",
    description: "Set of 3 spiral-bound notebooks with campus logo. Perfect for taking notes in class.",
    shortDescription: "Set of 3 spiral-bound notebooks",
    category: "stationery",
    price: 299,
    stock: 90,
    images: [{
      url: "/images/stationery.svg",
      alt: "Campus Notebook Set",
      isPrimary: true
    }],
    tags: ["stationery", "campus", "notebooks", "spiral"],
    specifications: {
      material: "Paper",
      pages: "200 pages each",
      features: "Spiral binding, ruled pages, durable cover"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Basketball",
    description: "Official size basketball with campus logo. Perfect for sports and recreation.",
    shortDescription: "Official size basketball with campus logo",
    category: "sports",
    price: 799,
    originalPrice: 999,
    discount: 20,
    stock: 60,
    images: [{
      url: "/images/sports.svg",
      alt: "Campus Basketball",
      isPrimary: true
    }],
    tags: ["sports", "campus", "basketball", "official size"],
    specifications: {
      material: "Rubber",
      size: "Official size (29.5 inches)",
      features: "Indoor/outdoor use, durable construction"
    },
    isActive: true,
    isFeatured: true
  },
  {
    name: "Campus Football",
    description: "Official size football with campus logo. Great for sports activities and games.",
    shortDescription: "Official size football with campus logo",
    category: "sports",
    price: 599,
    stock: 70,
    images: [{
      url: "/images/sports.svg",
      alt: "Campus Football",
      isPrimary: true
    }],
    tags: ["sports", "campus", "football", "official size"],
    specifications: {
      material: "Leather",
      size: "Official size",
      features: "Durable, good grip, weather resistant"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Textbook",
    description: "Essential campus textbook covering fundamental concepts. Required reading for students.",
    shortDescription: "Essential campus textbook",
    category: "books",
    price: 899,
    originalPrice: 1199,
    discount: 25,
    stock: 50,
    images: [{
      url: "/images/books.svg",
      alt: "Campus Textbook",
      isPrimary: true
    }],
    tags: ["books", "campus", "textbook", "education"],
    specifications: {
      pages: "500+ pages",
      edition: "Latest edition",
      features: "Hardcover, illustrations, study guide included"
    },
    isActive: true,
    isFeatured: true
  },
  {
    name: "Campus Study Guide",
    description: "Comprehensive study guide with campus logo. Perfect for exam preparation.",
    shortDescription: "Comprehensive study guide",
    category: "books",
    price: 399,
    stock: 80,
    images: [{
      url: "/images/books.svg",
      alt: "Campus Study Guide",
      isPrimary: true
    }],
    tags: ["books", "campus", "study guide", "exam preparation"],
    specifications: {
      pages: "200+ pages",
      format: "Paperback",
      features: "Practice questions, answer key, quick reference"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Gift Box",
    description: "Premium gift box containing campus merchandise. Perfect for special occasions and gifts.",
    shortDescription: "Premium gift box with campus merchandise",
    category: "gifts",
    price: 1299,
    originalPrice: 1599,
    discount: 19,
    stock: 40,
    images: [{
      url: "/images/gifts.svg",
      alt: "Campus Gift Box",
      isPrimary: true
    }],
    tags: ["gifts", "campus", "gift box", "premium"],
    specifications: {
      contents: "Multiple items",
      packaging: "Premium gift box",
      features: "Curated selection, perfect for gifting"
    },
    isActive: true,
    isFeatured: true
  },

  // Additional Products
  {
    name: "Campus Water Bottle",
    description: "Insulated stainless steel water bottle with campus logo. Keeps drinks cold for 24 hours.",
    shortDescription: "Insulated stainless steel water bottle",
    category: "accessories",
    price: 399,
    originalPrice: 499,
    discount: 20,
    stock: 150,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Water Bottle",
      isPrimary: true
    }],
    tags: ["accessories", "campus", "water bottle", "insulated"],
    specifications: {
      material: "Stainless Steel",
      capacity: "500ml",
      features: "Insulated, leak-proof, BPA-free"
    },
    isActive: true,
    isFeatured: true
  },
  {
    name: "Campus Backpack",
    description: "Durable laptop backpack with campus logo. Multiple compartments for all your campus essentials.",
    shortDescription: "Durable laptop backpack with campus logo",
    category: "accessories",
    price: 899,
    originalPrice: 1199,
    discount: 25,
    stock: 80,
    images: [{
      url: "/images/accessories.svg",
      alt: "Campus Backpack",
      isPrimary: true
    }],
    tags: ["accessories", "campus", "backpack", "laptop"],
    specifications: {
      material: "Nylon",
      capacity: "30L",
      features: "Laptop compartment, multiple pockets, padded straps"
    },
    isActive: true,
    isFeatured: true
  },
  {
    name: "Campus Baseball Cap",
    description: "Adjustable baseball cap with campus logo. Perfect for outdoor activities and sports.",
    shortDescription: "Adjustable baseball cap with campus logo",
    category: "apparel",
    price: 199,
    originalPrice: 249,
    discount: 20,
    stock: 200,
    images: [{
      url: "/images/apparel.svg",
      alt: "Campus Baseball Cap",
      isPrimary: true
    }],
    tags: ["apparel", "campus", "cap", "baseball"],
    specifications: {
      material: "Cotton",
      features: "Adjustable strap, curved brim, embroidered logo"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Sweatpants",
    description: "Comfortable sweatpants with campus logo. Perfect for lounging and casual wear.",
    shortDescription: "Comfortable sweatpants with campus logo",
    category: "apparel",
    price: 599,
    originalPrice: 799,
    discount: 25,
    stock: 120,
    images: [{
      url: "/images/apparel.svg",
      alt: "Campus Sweatpants",
      isPrimary: true
    }],
    tags: ["apparel", "campus", "sweatpants", "casual"],
    specifications: {
      material: "Cotton Blend",
      sizes: "S, M, L, XL, XXL",
      features: "Elastic waistband, drawstring, side pockets"
    },
    isActive: true,
    isFeatured: true
  },
  {
    name: "Campus Desk Organizer",
    description: "Wooden desk organizer with campus logo. Perfect for keeping your study space organized.",
    shortDescription: "Wooden desk organizer with campus logo",
    category: "stationery",
    price: 349,
    originalPrice: 449,
    discount: 22,
    stock: 90,
    images: [{
      url: "/images/stationery.svg",
      alt: "Campus Desk Organizer",
      isPrimary: true
    }],
    tags: ["stationery", "campus", "desk", "organizer"],
    specifications: {
      material: "Wood",
      dimensions: "25cm x 15cm x 10cm",
      features: "Multiple compartments, smooth finish"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Bluetooth Speaker",
    description: "Portable Bluetooth speaker with campus logo. High-quality sound for music and calls.",
    shortDescription: "Portable Bluetooth speaker with campus logo",
    category: "electronics",
    price: 1299,
    originalPrice: 1699,
    discount: 24,
    stock: 60,
    images: [{
      url: "/images/electronics.svg",
      alt: "Campus Bluetooth Speaker",
      isPrimary: true
    }],
    tags: ["electronics", "campus", "speaker", "bluetooth"],
    specifications: {
      connectivity: "Bluetooth 5.0",
      battery: "12 hours",
      features: "Waterproof, hands-free calling, LED lights"
    },
    isActive: true,
    isFeatured: true
  },
  {
    name: "Campus Fitness Tracker",
    description: "Smart fitness tracker with campus logo. Tracks steps, heart rate, and sleep patterns.",
    shortDescription: "Smart fitness tracker with campus logo",
    category: "electronics",
    price: 1999,
    originalPrice: 2499,
    discount: 20,
    stock: 40,
    images: [{
      url: "/images/electronics.svg",
      alt: "Campus Fitness Tracker",
      isPrimary: true
    }],
    tags: ["electronics", "campus", "fitness", "tracker"],
    specifications: {
      display: "1.4 inch color screen",
      battery: "7 days",
      features: "Heart rate monitor, GPS, water resistant"
    },
    isActive: true,
    isFeatured: true
  },
  {
    name: "Campus Yoga Block",
    description: "Eco-friendly yoga block with campus logo. Perfect for yoga and stretching exercises.",
    shortDescription: "Eco-friendly yoga block with campus logo",
    category: "sports",
    price: 249,
    originalPrice: 299,
    discount: 17,
    stock: 100,
    images: [{
      url: "/images/sports.svg",
      alt: "Campus Yoga Block",
      isPrimary: true
    }],
    tags: ["sports", "campus", "yoga", "block"],
    specifications: {
      material: "EVA Foam",
      dimensions: "23cm x 15cm x 7.5cm",
      features: "Lightweight, non-slip surface, easy to clean"
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: "Campus Resistance Bands Set",
    description: "Set of 5 resistance bands with campus logo. Perfect for strength training and rehabilitation.",
    shortDescription: "Set of 5 resistance bands with campus logo",
    category: "sports",
    price: 399,
    originalPrice: 499,
    discount: 20,
    stock: 80,
    images: [{
      url: "/images/sports.svg",
      alt: "Campus Resistance Bands Set",
      isPrimary: true
    }],
    tags: ["sports", "campus", "resistance", "bands"],
    specifications: {
      resistance: "5 different levels",
      material: "Natural latex",
      features: "Door anchor, handles, exercise guide"
    },
    isActive: true,
    isFeatured: true
  },
  {
    name: "Campus Cookbook",
    description: "Campus recipes cookbook with campus logo. Healthy and easy recipes for students.",
    shortDescription: "Campus recipes cookbook with campus logo",
    category: "books",
    price: 199,
    originalPrice: 249,
    discount: 20,
    stock: 120,
    images: [{
      url: "/images/books.svg",
      alt: "Campus Cookbook",
      isPrimary: true
    }],
    tags: ["books", "campus", "cookbook", "recipes"],
    specifications: {
      pages: "200",
      format: "Paperback",
      features: "Color photos, easy instructions, budget-friendly"
    },
    isActive: true,
    isFeatured: false
  }
];

const sampleUsers = [
  {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    password: "password123",
    phone: "9876543210",
    department: "Computer Science",
    studentId: "CS2024001",
    role: "user"
  },
  {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    password: "password123",
    phone: "9876543211",
    department: "Electronics",
    studentId: "EC2024001",
    role: "department_head"
  },
  {
    firstName: "Admin",
    lastName: "User",
    email: "admin@example.com",
    password: "admin123",
    phone: "9876543212",
    department: "Administration",
    role: "admin"
  }
];

async function seedData() {
  try {
    console.log('Starting data seeding...');
    
    // Clear existing data
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');
    
    // Create sample users first
    const users = await User.insertMany(sampleUsers);
    console.log(`Created ${users.length} users`);
    
    // Get admin user for createdBy field
    const adminUser = users.find(user => user.role === 'admin');
    
    // Add createdBy field to products
    const productsWithCreator = sampleProducts.map(product => ({
      ...product,
      createdBy: adminUser._id
    }));
    
    // Create sample products
    const products = await Product.insertMany(productsWithCreator);
    console.log(`Created ${products.length} products`);
    
    console.log('Data seeding completed successfully!');
    console.log('\nSample Users:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });
    
    console.log('\nProduct Categories:');
    const categories = [...new Set(products.map(p => p.category))];
    categories.forEach(category => {
      const count = products.filter(p => p.category === category).length;
      console.log(`- ${category}: ${count} products`);
    });
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedData();
