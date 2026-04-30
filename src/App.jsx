import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { ShoppingCart, X, Store, MessageCircle, Trash2, Image as ImageIcon, ArrowRight } from 'lucide-react';

// SISTEMA DE CONEXIÓN FLEXIBLE
let app, auth, db;
let isFirebaseReady = false;
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'tienda-default';

try {
  if (typeof __firebase_config !== 'undefined') {
    const firebaseConfig = typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseReady = true;
  }
} catch (e) {
  console.warn("Iniciando en modo demostración para Vercel.");
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [storeConfig, setStoreConfig] = useState({
    storeName: 'LLANTAS PREMIUM',
    buttonColor: '#000000',
    currency: '$',
    storeDescription: 'Expertos en rines y llantas de alta gama'
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
      });
      return () => unsub();
    } else {
      // PRODUCTOS DE MUESTRA CON EL DISEÑO FINAL
      setProducts([
        { name: 'Llanta Deportiva Z-Performance', price: 450000, image: null, desc: 'Máximo agarre en seco' },
        { name: 'Rin 18 Forjado Negro Mate', price: 890000, image: null, desc: 'Ligereza y resistencia extrema' },
        { name: 'Kit de Limpieza Pro', price: 45000, image: null, desc: 'Brillo espejo para tus rines' }
      ]);
    }
  }, []);

  const total = cart.reduce((acc, item) => acc + Number(item.price), 0);

  const enviarWhatsApp = () => {
    const items = cart.map(i => `- ${i.name} (${storeConfig.currency}${i.price.toLocaleString()})`).join('\n');
    const mensaje = `¡Hola! Me interesa este pedido de la tienda:\n\n${items}\n\nTotal: ${storeConfig.currency}${total.toLocaleString()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-black selection:text-white">
      
      {/* HEADER DE ADVERTENCIA (SOLO SI NO HAY DB) */}
      {!isFirebaseReady && (
        <div className="bg-black text-white text-[10px] py-2 text-center font-bold tracking-[0.3em] uppercase border-b border-white/10">
          Visualización de diseño - Modo Vercel
        </div>
      )}

      {/* NAVBAR PREMIUM */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 md:px-12 h-24 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-black/20" style={{ backgroundColor: storeConfig.buttonColor }}>
            <Store size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-[900] text-2xl uppercase tracking-tighter leading-none">{storeConfig.storeName}</h1>
            <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Official Store</span>
          </div>
        </div>
        
        <button 
          onClick={() => setIsCartOpen(true)} 
          className="relative group p-4 bg-black rounded-3xl text-white transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/10"
        >
          <ShoppingCart size={24} strokeWidth={2} />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border-4 border-white animate-in zoom-in">
              {cart.length}
            </span>
          )}
        </button>
      </nav>

      {/* HERO SECTION CATÁLOGO */}
      <header className="max-w-7xl mx-auto px-6 pt-12 pb-6">
        <div className="bg-white rounded-[3.5rem] p-12 md:p-20 border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gray-50 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-gray-100 transition-colors"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl text-center md:text-left">
              <h2 className="text-6xl md:text-8xl font-[900] mb-6 tracking-tighter leading-[0.9] uppercase italic">
                Nuevos <br/><span className="text-gray-300">Arribos</span>
              </h2>
              <p className="text-gray-400 font-bold text-sm uppercase tracking-widest leading-relaxed">
                {storeConfig.storeDescription}
              </p>
            </div>
            <div className="hidden md:flex w-64 h-64 bg-black rounded-[3rem] items-center justify-center rotate-12 shadow-2xl">
              <Store size={80} className="text-white opacity-20" />
            </div>
          </div>
        </div>
      </header>

      {/* GRILLA DE PRODUCTOS */}
      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {products.map((p, i) => (
          <div key={i} className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col">
            <div className="aspect-[4/5] bg-[#F1F1F1] relative overflow-hidden">
              {p.image ? (
                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-gray-300">
                  <ImageIcon size={60} strokeWidth={1} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Sin imagen disponible</span>
                </div>
              )}
              <div className="absolute bottom-6 left-6">
                <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                  Top Seller
                </span>
              </div>
            </div>
            
            <div className="p-10 flex flex-col flex-1">
              <div className="flex-1">
                <h3 className="font-black text-xl uppercase tracking-tighter mb-2 group-hover:text-gray-600 transition-colors">{p.name}</h3>
                <p className="text-gray-400 text-xs font-bold uppercase mb-6 tracking-wider">{p.desc || 'Edición Especial'}</p>
              </div>
              
              <div className="flex items-center justify-between mt-auto">
                <p className="text-3xl font-[900] tracking-tighter">
                  <span className="text-sm font-bold mr-1 align-top mt-1 inline-block opacity-40">{storeConfig.currency}</span>
                  {Number(p.price).toLocaleString()}
                </p>
                <button 
                  onClick={() => setCart([...cart, p])}
                  style={{ backgroundColor: storeConfig.buttonColor }}
                  className="w-16 h-16 rounded-[1.5rem] text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl shadow-black/10"
                >
                  <ArrowRight size={24} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* CARRITO SIDEBAR */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
            
            <div className="p-10 flex justify-between items-center border-b border-gray-50">
              <h2 className="text-4xl font-[900] uppercase tracking-tighter">Pedido</h2>
              <button onClick={() => setIsCartOpen(false)} className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X size={20}/>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <ShoppingCart size={80} strokeWidth={1} className="mb-4" />
                  <p className="font-black uppercase tracking-widest text-xs italic">Nada por aquí aún</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="flex gap-6 items-center group">
                    <div className="w-20 h-20 bg-gray-100 rounded-3xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-gray-300" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-xs uppercase tracking-tight">{item.name}</p>
                      <p className="font-bold text-gray-400 text-sm">{storeConfig.currency}{Number(item.price).toLocaleString()}</p>
                    </div>
                    <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-red-500 p-4 hover:bg-red-50 rounded-2xl transition-colors">
                      <Trash2 size={20}/>
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-10 bg-gray-50 rounded-t-[3rem]">
                <div className="flex justify-between items-center mb-8">
                  <span className="font-bold text-gray-400 uppercase text-[10px] tracking-widest">Total Estimado</span>
                  <span className="text-4xl font-[900] tracking-tighter">{storeConfig.currency}{total.toLocaleString()}</span>
                </div>
                <button 
                  onClick={enviarWhatsApp}
                  className="w-full py-7 bg-green-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.25em] shadow-2xl shadow-green-200 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <MessageCircle size={22} fill="white" />
                  Confirmar Pedido
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="py-20 text-center opacity-20">
        <Store size={32} className="mx-auto mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Powered by Cuádralo & Vercel</p>
      </footer>
    </div>
  );
}
