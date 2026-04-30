import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { ShoppingCart, X, Store, MessageCircle, Trash2, Image as ImageIcon, ChevronRight } from 'lucide-react';

// CONFIGURACIÓN DE CONEXIÓN SEGURA
let app, auth, db;
let isFirebaseReady = false;
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'tienda-personalizada';

try {
  if (typeof __firebase_config !== 'undefined') {
    const firebaseConfig = typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseReady = true;
  }
} catch (e) {
  console.warn("Modo visualización activo.");
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [storeConfig, setStoreConfig] = useState({
    storeName: 'MI TIENDA',
    buttonColor: '#1a1a1a',
    currency: '$',
    theme: 'modern'
  });

  useEffect(() => {
    if (isFirebaseReady) {
      const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'config', 'tienda');
      const unsub = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.products) setProducts(data.products);
          if (data.config) setStoreConfig(prev => ({ ...prev, ...data.config }));
        }
      }, (error) => console.error("Error:", error));
      return () => unsub();
    } else {
      // CARGA DE TUS PRODUCTOS SEGÚN EL DISEÑO QUE APROBASTE
      setProducts([
        { name: 'Producto Premium 1', price: 1500, image: null, desc: 'Descripción detallada del producto' },
        { name: 'Producto Premium 2', price: 2400, image: null, desc: 'Calidad superior garantizada' },
        { name: 'Producto Premium 3', price: 950, image: null, desc: 'El más buscado de la temporada' }
      ]);
    }
  }, []);

  const total = cart.reduce((acc, item) => acc + Number(item.price), 0);

  const enviarWhatsApp = () => {
    const items = cart.map(i => `- ${i.name} (${storeConfig.currency}${i.price})`).join('\n');
    const mensaje = `¡Hola! Me interesa comprar:\n\n${items}\n\nTotal: ${storeConfig.currency}${total.toLocaleString()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      
      {/* NAVBAR PERSONALIZADO */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: storeConfig.buttonColor }}>
            <Store size={20} />
          </div>
          <span className="font-black text-xl tracking-tighter uppercase italic">{storeConfig.storeName}</span>
        </div>
        
        <button 
          onClick={() => setIsCartOpen(true)} 
          className="p-3 bg-gray-100 rounded-2xl relative hover:bg-gray-200 transition-colors"
        >
          <ShoppingCart size={22} strokeWidth={2.5} />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-black text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold">
              {cart.length}
            </span>
          )}
        </button>
      </nav>

      {/* DISEÑO DE GRILLA QUE TRABAJAMOS ANTES */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-5xl font-black tracking-tight uppercase mb-2">Catálogo</h2>
          <div className="h-2 w-20 bg-black"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {products.map((p, i) => (
            <div key={i} className="group">
              <div className="aspect-[3/4] bg-gray-50 rounded-[2rem] overflow-hidden mb-6 relative shadow-sm group-hover:shadow-xl transition-all duration-500">
                {p.image ? (
                  <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-200">
                    <ImageIcon size={64} strokeWidth={1} />
                  </div>
                )}
                <button 
                  onClick={() => setCart([...cart, p])}
                  className="absolute bottom-6 right-6 w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-black hover:text-white"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
              
              <h3 className="font-bold text-lg mb-1 uppercase tracking-tight">{p.name}</h3>
              <p className="text-gray-400 text-xs mb-3 uppercase font-medium">{p.desc}</p>
              <p className="text-2xl font-black">{storeConfig.currency}{Number(p.price).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </main>

      {/* SIDEBAR DEL CARRITO */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase">Tu Carrito</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {cart.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden font-bold">
                    {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-gray-300" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm uppercase leading-tight">{item.name}</p>
                    <p className="text-gray-400 font-bold text-xs">{storeConfig.currency}{Number(item.price).toLocaleString()}</p>
                  </div>
                  <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-red-500 p-2"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>

            <div className="p-8 bg-gray-50 border-t">
              <div className="flex justify-between items-center mb-6 font-black uppercase">
                <span className="text-gray-400 text-xs">Total</span>
                <span className="text-2xl">{storeConfig.currency}{total.toLocaleString()}</span>
              </div>
              <button 
                onClick={enviarWhatsApp}
                className="w-full py-5 bg-green-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} fill="white" /> Finalizar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
