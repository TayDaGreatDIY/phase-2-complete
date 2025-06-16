import React, { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import Layout from './Layout';

const Store = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const categories = [
    { id: 'all', name: 'All Products', icon: '🛍️' },
    { id: 'footwear', name: 'Footwear', icon: '👟' },
    { id: 'equipment', name: 'Equipment', icon: '🏀' },
    { id: 'apparel', name: 'Apparel', icon: '👕' },
    { id: 'accessories', name: 'Accessories', icon: '🎒' },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const category = selectedCategory === 'all' ? null : selectedCategory;
        const response = await productsAPI.getProducts(0, 100, category);
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory]);

  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        {product.stock_quantity < 10 && product.stock_quantity > 0 && (
          <div className="absolute top-2 left-2">
            <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded">
              Low Stock
            </span>
          </div>
        )}
        {product.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">{product.name}</h3>
          <span className="text-lg font-bold text-orange-600 ml-2">${product.price}</span>
        </div>
        
        {product.brand && (
          <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
        )}
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <span className="text-yellow-400">⭐</span>
            <span className="ml-1 text-sm text-gray-600">{product.rating}</span>
            <span className="ml-1 text-sm text-gray-500">({product.total_ratings})</span>
          </div>
          <span className="text-sm text-gray-500">
            {product.stock_quantity} in stock
          </span>
        </div>
        
        {product.colors.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.colors.slice(0, 5).map((color, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                {color}
              </span>
            ))}
            {product.colors.length > 5 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                +{product.colors.length - 5}
              </span>
            )}
          </div>
        )}
        
        <button
          onClick={() => setSelectedProduct(product)}
          disabled={product.stock_quantity === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md font-medium transition-colors"
        >
          {product.stock_quantity === 0 ? 'Out of Stock' : 'View Details'}
        </button>
      </div>
    </div>
  );

  const ProductModal = ({ product, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
            {product.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${product.name} ${index + 1}`}
                className="w-full h-48 object-cover rounded-md"
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 text-gray-600 hover:text-gray-800"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
              {product.brand && <p className="text-gray-600">{product.brand}</p>}
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-orange-600">${product.price}</span>
            </div>
          </div>
          
          <div className="flex items-center mb-4">
            <div className="flex items-center mr-6">
              <span className="text-yellow-400 text-lg">⭐</span>
              <span className="ml-2 text-lg font-medium">{product.rating}</span>
              <span className="ml-1 text-gray-500">({product.total_ratings} reviews)</span>
            </div>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
              product.stock_quantity > 10 ? 'bg-green-100 text-green-800' :
              product.stock_quantity > 0 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {product.stock_quantity > 0 ? 
                `${product.stock_quantity} in stock` : 'Out of stock'}
            </span>
          </div>
          
          <p className="text-gray-700 mb-6">{product.description}</p>
          
          {product.features.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
              <ul className="list-disc list-inside space-y-1">
                {product.features.map((feature, index) => (
                  <li key={index} className="text-gray-600">{feature}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {product.sizes.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Available Sizes</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size, index) => (
                    <span key={index} className="px-3 py-1 border border-gray-300 rounded-md text-sm">
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {product.colors.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Available Colors</h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color, index) => (
                    <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button 
              disabled={product.stock_quantity === 0}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-md font-medium transition-colors"
            >
              {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-md font-medium transition-colors">
              Add to Wishlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Basketball Store</h1>
          <p className="text-gray-600">Get the best basketball gear to elevate your game</p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl">🛍️</span>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
            <p className="mt-2 text-gray-500">
              {selectedCategory === 'all' 
                ? 'Check back later for new products.' 
                : `No products in ${categories.find(c => c.id === selectedCategory)?.name} category.`}
            </p>
          </div>
        )}

        {selectedProduct && (
          <ProductModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
          />
        )}
      </div>
    </Layout>
  );
};

export default Store;