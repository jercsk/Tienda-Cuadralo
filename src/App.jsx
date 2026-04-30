import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { 
  ShoppingCart, X, Plus, Minus, Store, MessageCircle, 
  Trash2, ChevronRight, Image as ImageIcon 
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE (ADAPTADA PARA VERCEL) ---
let app, auth, db;
let isFirebaseReady = false;
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'tienda-pro';

try {
  if (typeof __firebase_config !== 'undefined') {
    const firebaseConfig = typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseReady = true;
  }
} catch (e) {
  console.warn("Modo demostración: Configuración de Firebase no detectada.");
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [storeConfig, setStoreConfig] = useState({
    storeName: 'Mi Tienda Online',
    primaryColor: '#2563eb',
    currency: '$',
    whatsapp: ''
  });

  // --- CARGA DE DATOS ---
  useEffect(() => {
    if (isFirebaseReady) {
      const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'config', 'tienda');
      const unsub = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.products) setProducts(data.products);
          if (data.config) setStoreConfig(prev => ({ ...prev, ...data.config }));
        }
      });
      return () => unsub();
    } else {
      // Datos de ejemplo basados en tu archivo Modelo.html si no hay conexión
      setProducts([
        { id: 1, name: 'Zapatillas Urbanas', price: 45.00, category: 'Calzado', image: null, description: 'Cómodas y transpirables.' },
        { id: 2, name: 'Reloj Minimalista', price: 35.50, category: 'Accesorios', image: null, description: 'Diseño elegante.' },
        { id: 3, name: 'Mochila de Cuero', price: 60.00, category: 'Bolsos', image: null, description: 'Ideal para laptops.' }
      ]);
    }
  }, []);

  // --- LÓGICA DEL CARRITO ---
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setIsCartOpen(true);
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const categories = ['Todos', ...new Set(products.map(p => p.category))];
  const filteredProducts = activeCategory === 'Todos' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const checkoutWhatsApp = () => {
    const message = `*Nuevo Pedido - ${storeConfig.storeName}*\n\n` +
      cart.map(i => `• ${i.name} (x${i.quantity}) - ${storeConfig.currency}${(i.price * i.quantity).toFixed(2)}`).join('\n') +
      `\n\n*Total: ${storeConfig.currency}${cartTotal.toFixed(2)}*`;
    window.open(`https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: storeConfig.primaryColor }}>
              <Store size={22} />
            </div>
            <h1 className="text-xl font-black tracking-tight uppercase">{storeConfig.storeName}</h1>
          </div>

          <button 
            onClick={() => setIsCartOpen(true)}
            className="flex items-center space-x-2 bg-gray-900 text-white px-5 py-2.5 rounded-2xl hover:scale-105 transition-all shadow-md"
          >
            <ShoppingCart size={20} />
            <span className="font-bold text-sm">{cart.length}</span>
          </button>
        </div>
      </header>

      {/* CATEGORÍAS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 overflow-x-auto no-scrollbar">
        <div className="flex space-x-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                activeCategory === cat 
                ? 'text-white shadow-lg' 
                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'
              }`}
              style={activeCategory === cat ? { backgroundColor: storeConfig.primaryColor } : {}}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTOS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map(p => (
            <div key={p.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300">
              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 italic text-xs">
                    <ImageIcon size={40} strokeWidth={1} className="mb-2 opacity-50" />
                    Sin imagen
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-gray-500 shadow-sm">
                    {p.category}
                  </span>
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-bold text-lg mb-1 leading-tight">{p.name}</h3>
                <p className="text-gray-400 text-xs line-clamp-2 mb-4 flex-1">{p.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-2xl font-black text-gray-900">{storeConfig.currency}{Number(p.price).toFixed(2)}</span>
                  <button 
                    onClick={() => addToCart(p)}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all shadow-lg"
                    style={{ backgroundColor: storeConfig.primaryColor }}
                  >
                    <Plus size={20} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* CARRITO SIDEBAR */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b flex justify-between items-center bg-white">
              <div className="flex items-center space-x-2">
                <ShoppingCart size={24} className="text-gray-900" />
                <h2 className="text-xl font-black uppercase tracking-tight">Tu Pedido</h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                  <ShoppingCart size={48} className="mb-4" strokeWidth={1} />
                  <p className="font-bold uppercase text-xs tracking-widest">Carrito vacío</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-gray-300" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm uppercase leading-tight">{item.name}</h4>
                      <p className="text-gray-400 font-bold text-xs">{storeConfig.currency}{item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center bg-gray-100 rounded-xl p-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-gray-500 hover:text-black"><Minus size={14}/></button>
                      <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-gray-500 hover:text-black"><Plus size={14}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-white border-t space-y-4">
                <div className="flex justify-between items-center font-black">
                  <span className="text-gray-400 text-xs uppercase tracking-widest">Total del pedido</span>
                  <span className="text-3xl tracking-tighter">{storeConfig.currency}{cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={checkoutWhatsApp}
                  className="w-full py-5 bg-green-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-green-700 transition-all flex items-center justify-center space-x-3 active:scale-95"
                >
                  <MessageCircle size={20} fill="white" />
                  <span>Enviar por WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
