import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { ShoppingCart, X, Store, MessageCircle, Trash2, Image as ImageIcon } from 'lucide-react';

// 1. SISTEMA ANTICHOQUES: Verificamos si existen credenciales antes de conectar
let app, auth, db;
let isFirebaseReady = false;
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'tienda-default';

try {
  // Solo se conecta si detecta la configuración
  if (typeof __firebase_config !== 'undefined') {
    const firebaseConfig = typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseReady = true;
  }
} catch (error) {
  console.warn("Base de datos no detectada. Iniciando modo seguro.");
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [storeConfig, setStoreConfig] = useState({
    storeName: 'Mi Tienda',
    buttonColor: '#111827',
    currency: '$'
  });

  useEffect(() => {
    if (isFirebaseReady) {
      // Si hay base de datos, carga tus productos reales
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
      // SI ESTAMOS EN VERCEL SIN DATOS: Muestra productos de prueba en vez de pantalla blanca
      setProducts([
        { name: 'Llanta Deportiva Rin 17 (Prueba)', price: 120, image: null },
        { name: 'Llanta Todo Terreno Rin 15 (Prueba)', price: 150, image: null }
      ]);
      setStoreConfig(prev => ({ ...prev, storeName: 'Tienda Vercel (Sin DB)' }));
    }
  }, []);

  const total = cart.reduce((acc, item) => acc + Number(item.price), 0);

  const enviarWhatsApp = () => {
    const items = cart.map(i => `- ${i.name} (${storeConfig.currency}${i.price})`).join('\n');
    const mensaje = `¡Hola! Quiero hacer un pedido:\n\n${items}\n\nTotal: ${storeConfig.currency}${total.toLocaleString()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 font-sans">
      
      {/* Alerta si no hay base de datos */}
      {!isFirebaseReady && (
        <div className="bg-amber-100 text-amber-800 p-3 text-center text-xs font-bold">
          Modo de prueba activo. La tienda requiere conexión a Firebase para ver tus productos reales.
        </div>
      )}

      {/* Navegación */}
      <nav className="bg-white border-b sticky top-0 z-40 px-6 h-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg text-white" style={{ backgroundColor: storeConfig.buttonColor }}>
            <Store size={24} />
          </div>
          <h1 className="font-black text-xl uppercase tracking-tighter">{storeConfig.storeName}</h1>
        </div>
        <button 
          onClick={() => setIsCartOpen(true)} 
          className="p-3 bg-gray-900 rounded-2xl text-white relative hover:scale-105 transition-transform"
        >
          <ShoppingCart size={22} />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 w-6 h-6 rounded-full text-[10px] flex items-center justify-center border-2 border-white font-bold">
              {cart.length}
            </span>
          )}
        </button>
      </nav>

      {/* Catálogo */}
      <main className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((p, i) => (
          <div key={i} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-shadow">
            <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
              {p.image ? (
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={40} className="text-gray-300" />
              )}
            </div>
            <div className="p-8">
              <h3 className="font-bold uppercase text-xs text-gray-400 mb-1">{p.name}</h3>
              <p className="text-3xl font-black mb-6">{storeConfig.currency}{Number(p.price).toLocaleString()}</p>
              <button 
                onClick={() => setCart([...cart, p])}
                style={{ backgroundColor: storeConfig.buttonColor }}
                className="w-full py-5 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
              >
                Agregar al Pedido
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* Modal del Carrito */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative bg-white w-full max-w-sm h-full p-8 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black uppercase tracking-tighter">Tu Pedido</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4">
              {cart.length === 0 ? (
                <p className="text-center py-20 text-gray-400 font-bold uppercase text-xs">El carrito está vacío</p>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div>
                      <p className="font-bold text-sm uppercase">{item.name}</p>
                      <p className="text-gray-400 font-bold text-xs">{storeConfig.currency}{Number(item.price).toLocaleString()}</p>
                    </div>
                    <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-6 border-t mt-6">
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-gray-400 uppercase text-xs">Total</span>
                <span className="text-3xl font-black">{storeConfig.currency}{total.toLocaleString()}</span>
              </div>
              <button 
                onClick={enviarWhatsApp}
                disabled={cart.length === 0}
                className="w-full py-6 bg-green-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <MessageCircle size={20} /> Confirmar por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
