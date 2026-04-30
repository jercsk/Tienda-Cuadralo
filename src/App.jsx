import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot 
} from "firebase/firestore";
import { 
  ShoppingCart, Settings, X, Store, MessageCircle, 
  Trash2, Image as ImageIcon, Lock 
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
// Usamos los valores proporcionados por el entorno
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'tienda-default';

// --- COMPONENTE PRINCIPAL ---
function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [storeConfig, setStoreConfig] = useState({
    storeName: 'Cuádralo Tienda',
    buttonColor: '#111827',
    currency: '$'
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      {/* Estilos embebidos para evitar errores de archivo .css externo */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Navegación */}
      <nav className="bg-white border-b sticky top-0 z-40 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: storeConfig.buttonColor }}>
            <Store size={20}/>
          </div>
          <h1 className="font-black text-xl uppercase tracking-tighter">{storeConfig.storeName}</h1>
        </div>
        <button onClick={() => setIsCartOpen(true)} className="relative p-3 bg-gray-900 rounded-xl text-white">
          <ShoppingCart size={20} />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white">
              {cart.length}
            </span>
          )}
        </button>
      </nav>

      {/* Banner Principal */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white rounded-[3rem] p-10 md:p-16 border border-gray-100 shadow-xl flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-5xl md:text-6xl font-black mb-4 tracking-tighter leading-none">BIENVENIDO</h2>
            <p className="text-gray-400 font-medium text-lg uppercase tracking-widest">Calidad y estilo en cada pedido</p>
          </div>
          <div className="w-48 h-48 bg-gray-100 rounded-[2.5rem] flex items-center justify-center">
            <Store size={60} className="text-gray-300" />
          </div>
        </div>
      </div>

      {/* Catálogo de Productos */}
      <main className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-4 border-dashed border-gray-100">
            <ImageIcon size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="font-black text-gray-300 uppercase tracking-widest text-xs">Cargando productos...</p>
          </div>
        ) : (
          products.map(p => (
            <div key={p.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all">
              <div className="aspect-square bg-gray-50 flex items-center justify-center">
                {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <ImageIcon size={32} className="text-gray-200" />}
              </div>
              <div className="p-6">
                <h3 className="font-black uppercase text-sm tracking-tight">{p.name}</h3>
                <p className="text-xl font-black mt-2">{storeConfig.currency}{p.price}</p>
                <button 
                  onClick={() => setCart([...cart, p])}
                  style={{ backgroundColor: storeConfig.buttonColor }}
                  className="w-full mt-4 py-3 rounded-xl text-white font-black text-[10px] tracking-widest uppercase"
                >Agregar Pedido</button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Modal de Carrito */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative bg-white w-full max-w-sm h-full shadow-2xl flex flex-col p-8 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black uppercase">Tu Orden</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 bg-gray-100 rounded-lg"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-center text-gray-400 font-bold uppercase text-[10px] mt-20">El carrito está vacío</p>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center mb-4 bg-gray-50 p-4 rounded-2xl">
                    <span className="font-bold text-xs uppercase">{item.name}</span>
                    <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-red-500"><Trash2 size={16}/></button>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest mt-4">
                Confirmar Pedido
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
