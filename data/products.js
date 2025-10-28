// data/products.js - COMPLETE & WORKING

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
      inStock: true,
      image: '🌿'
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
      inStock: true,
      image: '🌿'
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
      inStock: true,
      image: '🌿'
    }
  ],

  singapore: [
    {
      id: 'sg_platinum_kush',
      name: 'Platinum Kush',
      category: 'Premium Strain',
      price: {
        '1g': 144,
        '3g': 420,
        '7g': 756,
        '14g': 1320,
        '28g': 1680
      },
      currency: 'SGD',
      description: 'Premium quality Platinum Kush',
      inStock: true,
      image: '🌿'
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
      inStock: true,
      image: '🌿'
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
      inStock: true,
      image: '🌿'
    }
  ],

  thailand: [
    {
      id: 'th_platinum_kush',
      name: 'Platinum Kush',
      category: 'Premium Strain',
      price: {
        '1g': 108,
        '3g': 315,
        '7g': 567,
        '14g': 990,
        '28g': 1260
      },
      currency: 'THB',
      description: 'Premium quality Platinum Kush',
      inStock: true,
      image: '🌿'
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
      inStock: true,
      image: '🌿'
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
      inStock: true,
      image: '🌿'
    }
  ]
};

const countries = ['malaysia', 'singapore', 'thailand'];

function getProductsByCountry(country) {
  const countryLower = country.toLowerCase();
  return products[countryLower] || [];
}

function getProductById(productId) {
  for (const country in products) {
    const product = products[country].find(p => p.id === productId);
    if (product) return product;
  }
  return null;
}

function getAllProducts() {
  const allProducts = [];
  for (const country in products) {
    allProducts.push(...products[country]);
  }
  return allProducts;
}

module.exports = {
  products,
  countries,
  getProductsByCountry,
  getProductById,
  getAllProducts
};