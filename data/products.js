// data/products.js

const products = {
  malaysia: [
    {
      id: 'my_platinum_kush',
      name: 'Platinum Kush',
      category: 'Premium Strain',
      price: {
        '1g': 120,
        '3g': 350,
        '7g': 630,
        '14g': 1100,
        '28g': 1400
      },
      currency: 'MYR',
      description: 'Premium quality Platinum Kush',
      inStock: true
    },
    {
      id: 'my_sour_diesel',
      name: 'Sour Diesel',
      category: 'Premium Strain',
      price: {
        '1g': 120,
        '3g': 350,
        '7g': 630,
        '14g': 1100,
        '28g': 1400
      },
      currency: 'MYR',
      description: 'Premium quality Sour Diesel',
      inStock: true
    },
    {
      id: 'my_vice_city',
      name: 'Vice City',
      category: 'Premium Strain',
      price: {
        '1g': 120,
        '3g': 350,
        '7g': 630,
        '14g': 1100,
        '28g': 1400
      },
      currency: 'MYR',
      description: 'Premium quality Vice City',
      inStock: true
    }
  ],

  singapore: [
    {
      id: 'sg_platinum_kush',
      name: 'Platinum Kush',
      category: 'Premium Strain',
      price: {
        '1g': 144,   // 120 * 1.2 = 144
        '3g': 420,   // 350 * 1.2 = 420
        '7g': 756,   // 630 * 1.2 = 756
        '14g': 1320, // 1100 * 1.2 = 1320
        '28g': 1680  // 1400 * 1.2 = 1680
      },
      currency: 'SGD',
      description: 'Premium quality Platinum Kush',
      inStock: true
    },
    {
      id: 'sg_sour_diesel',
      name: 'Sour Diesel',
      category: 'Premium Strain',
      price: {
        '1g': 144,
        '3g': 420,
        '7g': 756,
        '14g': 1320,
        '28g': 1680
      },
      currency: 'SGD',
      description: 'Premium quality Sour Diesel',
      inStock: true
    },
    {
      id: 'sg_vice_city',
      name: 'Vice City',
      category: 'Premium Strain',
      price: {
        '1g': 144,
        '3g': 420,
        '7g': 756,
        '14g': 1320,
        '28g': 1680
      },
      currency: 'SGD',
      description: 'Premium quality Vice City',
      inStock: true
    }
  ],

  thailand: [
    {
      id: 'th_platinum_kush',
      name: 'Platinum Kush',
      category: 'Premium Strain',
      price: {
        '1g': 108,   // 120 * 0.9 = 108
        '3g': 315,   // 350 * 0.9 = 315
        '7g': 567,   // 630 * 0.9 = 567
        '14g': 990,  // 1100 * 0.9 = 990
        '28g': 1260  // 1400 * 0.9 = 1260
      },
      currency: 'THB',
      description: 'Premium quality Platinum Kush',
      inStock: true
    },
    {
      id: 'th_sour_diesel',
      name: 'Sour Diesel',
      category: 'Premium Strain',
      price: {
        '1g': 108,
        '3g': 315,
        '7g': 567,
        '14g': 990,
        '28g': 1260
      },
      currency: 'THB',
      description: 'Premium quality Sour Diesel',
      inStock: true
    },
    {
      id: 'th_vice_city',
      name: 'Vice City',
      category: 'Premium Strain',
      price: {
        '1g': 108,
        '3g': 315,
        '7g': 567,
        '14g': 990,
        '28g': 1260
      },
      currency: 'THB',
      description: 'Premium quality Vice City',
      inStock: true
    }
  ]
};

// Available countries
const countries = ['malaysia', 'singapore', 'thailand'];

// Get products by country
function getProductsByCountry(country) {
  return products[country.toLowerCase()] || [];
}

// Get product by ID
function getProductById(productId) {
  for (const country in products) {
    const product = products[country].find(p => p.id === productId);
    if (product) return product;
  }
  return null;
}

module.exports = {
  products,
  countries,
  getProductsByCountry,
  getProductById
};