import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, collection, onSnapshot, setDoc } from "firebase/firestore";
import { 
  ShoppingCart, X, Plus, Store, MessageCircle, 
  Trash2, Image as ImageIcon, Settings, Save,
  User, MapPin, Mail, Phone, Lock, LogIn, ClipboardList,
  ChevronRight, Tag
} from 'lucide-react';

// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// REGLA 1: Ruta estricta y sanitizada
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'tienda-premium';
const cleanAppId = rawAppId.replace(/[^a-zA-Z0-9_-]/g, '_'); 

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('config'); 
  const [activeCategory, setActiveCategory] = useState('Todos');

  const [storeConfig, setStoreConfig] = useState({
    logo: '',
    heroImage: '',
    storeName: 'Mi Tienda VIP',
    slogan: 'Calidad Premium',
    buttonColor: '#0f172a',
    textColor: '#ffffff',
    titleColor: '#0f172a',
    whatsapp: '5491100000000',
    zones: 'Zona Norte, Zona Sur, Centro',
    description: 'Catálogo exclusivo de productos seleccionados',
    adminUser: 'admin',
    adminPass: '1234',
    nextTicket: 1
  });

  const [clientData, setClientData] = useState({
    nombre: '', apellido: '', whatsapp: '', email: '', zona: '', referencia: ''
  });

  const [tempConfig, setTempConfig] = useState({...storeConfig});
  const [tempProducts, setTempProducts] = useState([]);

  // --- REGLA 3: Autenticación obligatoria antes de cualquier operación ---
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Error crítico de autenticación:", err);
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (isMounted) {
        setUser(u);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // --- REGLA 1 y 2: Suscripción de datos con guardia de usuario ---
  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, 'artifacts', cleanAppId, 'public', 'data', 'store', 'main');
    
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.config) {
          setStoreConfig(prev => ({...prev, ...data.config}));
          setTempConfig(prev => ({...prev, ...data.config}));
        }
        if (data.products) {
          setProducts(data.products);
          setTempProducts(data.products);
        }
      }
    }, (error) => {
      console.error("Fallo en snapshot:", error);
    });

    return () => unsub();
  }, [user]);

  // Suscripción de Pedidos
  useEffect(() => {
    if (!user || !isAdminLoggedIn) return;
    const ordersColRef = collection(db, 'artifacts', cleanAppId, 'public', 'data', 'orders');
    const unsub = onSnapshot(ordersColRef, (snap) => {
      const fetchedOrders = [];
      snap.forEach(doc => fetchedOrders.push({ id: doc.id, ...doc.data() }));
      fetchedOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
      setOrders(fetchedOrders);
    });
    return () => unsub();
  }, [user, isAdminLoggedIn]);

  const handleImageUpload = (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 800000) { 
      alert("Imagen demasiado grande. Máximo 800KB."); 
      return; 
    }
    const reader = new FileReader();
    reader.onloadend = () => callback(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAdminLogin = () => {
    if (loginForm.user === storeConfig.adminUser && loginForm.pass === storeConfig.adminPass) {
      setIsAdminLoggedIn(true);
      setShowLoginModal(false);
      setTempConfig({...storeConfig});
      setTempProducts([...products]);
      setIsSettingsOpen(true);
      setLoginForm({user: '', pass: ''});
    } else {
      alert("Acceso denegado: Credenciales incorrectas");
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', cleanAppId, 'public', 'data', 'store', 'main');
    try {
      await setDoc(docRef, { config: tempConfig, products: tempProducts }, { merge: true });
      setIsSettingsOpen(false);
    } catch (err) { 
      console.error("Error al guardar en Firestore:", err); 
    }
  };

  const processCheckout = async () => {
    if (!user) return;
    if (!clientData.nombre || !clientData.apellido || !clientData.whatsapp || !clientData.email || !clientData.zona || !clientData.referencia) {
      alert("Por favor completa los campos obligatorios."); return;
    }

    const ticketString = String(storeConfig.nextTicket).padStart(3, '0');
    const total = cart.reduce((acc, item) => acc + (Number(item.price) * item.qty), 0);

    try {
      const ordersCol = collection(db, 'artifacts', cleanAppId, 'public', 'data', 'orders');
      const orderDoc = doc(ordersCol); 
      await setDoc(orderDoc, {
        ticketNumber: ticketString,
        client: clientData,
        items: cart,
        total: total,
        date: new Date().toISOString()
      });

      const nextNum = storeConfig.nextTicket >= 999 ? 1 : storeConfig.nextTicket + 1;
      const configDocRef = doc(db, 'artifacts', cleanAppId, 'public', 'data', 'store', 'main');
      await setDoc(configDocRef, { config: { nextTicket: nextNum } }, { merge: true });

      const itemsList = cart.map(i => `- ${i.name} (x${i.qty})`).join('\n');
      const msg = `*NUEVO PEDIDO #${ticketString}*\n\n*Cliente:* ${clientData.nombre} ${clientData.apellido}\n*Zona:* ${clientData.zona}\n\n*Productos:*\n${itemsList}\n\n*Total:* $${total.toLocaleString()}`;
      const phone = storeConfig.whatsapp ? String(storeConfig.whatsapp).replace(/\D/g, '') : '';
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
      
      setCart([]);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
    } catch (err) {
      console.error("Error en checkout:", err);
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? {...i, qty: i.qty + 1} : i);
      return [...prev, {...product, qty: 1}];
    });
  };

  const cartTotal = cart.reduce((acc, item) => acc + (Number(item.price) * item.qty), 0);
  const categories = ['Todos', ...new Set(products.map(p => p.category))].filter(Boolean);
  const filteredProducts = activeCategory === 'Todos' ? products : products.filter(p => p.category === activeCategory);
  const availableZones = (storeConfig.zones || '').split(',').map(z => z.trim()).filter(Boolean);

  // Helper para renderizar etiqueta de estado
  const renderBadge = (status) => {
    if (!status || status === 'Ninguno') return null;
    let styles = "bg-slate-900 text-white";
    if (status === 'Destacado') styles = "bg-amber-400 text-amber-950";
    if (status === 'En Promoción') styles = "bg-emerald-500 text-white";
    if (status === 'Quedan Pocos') styles = "bg-rose-500 text-white";
    
    return (
      <div className={`absolute top-2 left-2 z-10 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter shadow-sm flex items-center gap-1 ${styles}`}>
        <Tag size={8} /> {status}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Iniciando catálogo seguro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-24">
      
      {/* NAVEGACIÓN */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 md:px-8 h-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-lg overflow-hidden" style={{backgroundColor: storeConfig.buttonColor}}>
            {storeConfig.logo ? <img src={storeConfig.logo} alt="Logo" className="w-full h-full object-contain bg-white" /> : <Store size={22} />}
          </div>
          <h1 className="text-xl font-black tracking-tight uppercase" style={{color: storeConfig.titleColor}}>{storeConfig.storeName}</h1>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => { isAdminLoggedIn ? setIsSettingsOpen(true) : setShowLoginModal(true) }} 
            className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
          >
            {isAdminLoggedIn ? <Settings size={20}/> : <Lock size={20}/>}
          </button>
          
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="h-12 px-5 rounded-xl flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all relative"
            style={{backgroundColor: storeConfig.buttonColor, color: storeConfig.textColor}}
          >
            <ShoppingCart size={18} />
            <span className="font-bold text-xs">Mi Carrito</span>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs font-black border-2 border-white shadow-md">
                {cart.reduce((a, b) => a + b.qty, 0)}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* CABECERA / HERO */}
      <header className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        <div className="rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden shadow-2xl flex flex-col items-center justify-center text-center min-h-[220px] md:min-h-[280px]">
          {storeConfig.heroImage ? (
             <img src={storeConfig.heroImage} className="absolute inset-0 w-full h-full object-cover" alt="Banner" />
          ) : (
             <div className="absolute inset-0 bg-slate-900"></div>
          )}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
          
          <div className="relative z-10 w-full max-w-3xl flex flex-col items-center text-white">
            <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase mb-4 leading-tight drop-shadow-2xl text-center">
              {storeConfig.storeName}
            </h2>
            <p className="text-slate-100 font-bold uppercase tracking-[0.2em] text-xs md:text-sm max-w-lg leading-relaxed drop-shadow-lg opacity-90 text-center">
              {storeConfig.description}
            </p>
          </div>
        </div>
      </header>

      {/* CATEGORÍAS */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 flex gap-3 overflow-x-auto pb-2 no-scrollbar justify-center md:justify-start">
        {categories.map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2.5 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeCategory === cat ? 'border-transparent shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            style={activeCategory === cat ? { backgroundColor: storeConfig.buttonColor, color: storeConfig.textColor } : {}}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* LISTADO DE PRODUCTOS */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-300 font-bold uppercase tracking-widest">
            No hay productos disponibles
          </div>
        ) : (
          filteredProducts.map(p => (
            <div key={p.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group p-2">
              <div className="aspect-square bg-slate-50 rounded-[1.5rem] overflow-hidden relative">
                {renderBadge(p.status)}
                {p.image ? (
                  <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200"><ImageIcon size={40}/></div>
                )}
              </div>
              <div className="pt-4 pb-3 px-3 flex flex-col flex-1">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-wider mb-1">{p.category}</span>
                <h3 className="font-bold text-sm leading-tight mb-4 line-clamp-2" style={{color: storeConfig.titleColor}}>{p.name}</h3>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-xl font-black text-slate-900">${Number(p.price).toLocaleString()}</span>
                  <button 
                    onClick={() => addToCart(p)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all"
                    style={{backgroundColor: storeConfig.buttonColor, color: storeConfig.textColor}}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {/* BOTÓN WHATSAPP ATENCIÓN CLIENTE */}
      {storeConfig.whatsapp && (
        <a 
          href={`https://wa.me/${String(storeConfig.whatsapp).replace(/\D/g, '')}`} 
          target="_blank" rel="noreferrer"
          className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all animate-bounce hover:animate-none"
        >
          <MessageCircle size={32} fill="white" />
        </a>
      )}

      {/* MODAL AJUSTES ADMIN */}
      {isSettingsOpen && isAdminLoggedIn && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsSettingsOpen(false)}/>
          <div className="relative bg-white w-full max-w-5xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
            
            <div className="flex border-b bg-slate-50 p-2 overflow-x-auto no-scrollbar shrink-0">
              <button onClick={() => setSettingsTab('config')} className={`px-4 py-3 font-black text-[10px] uppercase rounded-xl transition-all whitespace-nowrap ${settingsTab === 'config' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}>Configuración</button>
              <button onClick={() => setSettingsTab('products')} className={`px-4 py-3 font-black text-[10px] uppercase rounded-xl transition-all whitespace-nowrap ${settingsTab === 'products' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}>Gestionar Catálogo</button>
              <button onClick={() => setSettingsTab('orders')} className={`px-4 py-3 font-black text-[10px] uppercase rounded-xl transition-all whitespace-nowrap ${settingsTab === 'orders' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}>Registro de Pedidos</button>
              <button onClick={() => setIsSettingsOpen(false)} className="ml-auto p-3 text-slate-400 hover:text-slate-900"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              
              {settingsTab === 'config' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-slate-200 rounded-[1.5rem] p-6 flex flex-col items-center text-center gap-3 bg-slate-50">
                      <p className="text-[10px] font-black uppercase text-slate-400">Logo Tienda</p>
                      {tempConfig.logo ? <img src={tempConfig.logo} className="h-20 object-contain rounded-lg bg-white p-2 shadow-sm" /> : <Store size={32} className="text-slate-300"/>}
                      <label className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase cursor-pointer hover:bg-slate-800 transition-all">
                        Cargar Imagen
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (b64) => setTempConfig({...tempConfig, logo: b64}))} className="hidden" />
                      </label>
                    </div>

                    <div className="border-2 border-dashed border-slate-200 rounded-[1.5rem] p-6 flex flex-col items-center text-center gap-3 bg-slate-50">
                      <p className="text-[10px] font-black uppercase text-slate-400">Imagen de Fondo Banner</p>
                      {tempConfig.heroImage ? <img src={tempConfig.heroImage} className="h-20 w-40 object-cover rounded-lg shadow-sm" /> : <ImageIcon size={32} className="text-slate-300"/>}
                      <label className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase cursor-pointer hover:bg-slate-800 transition-all">
                        Cargar Fondo
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (b64) => setTempConfig({...tempConfig, heroImage: b64}))} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-black text-[10px] uppercase text-slate-400 tracking-widest border-b pb-2">Información de Seguridad</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase ml-1 text-indigo-600">Admin Usuario</label>
                        <input value={tempConfig.adminUser} onChange={e => setTempConfig({...tempConfig, adminUser: e.target.value})} className="w-full bg-indigo-50 border-none p-3 rounded-xl font-bold text-sm" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase ml-1 text-indigo-600">Admin Clave</label>
                        <input type="password" value={tempConfig.adminPass} onChange={e => setTempConfig({...tempConfig, adminPass: e.target.value})} className="w-full bg-indigo-50 border-none p-3 rounded-xl font-bold text-sm" />
                      </div>
                    </div>
                    
                    <h4 className="font-black text-[10px] uppercase text-slate-400 tracking-widest border-b pb-2 mt-6">Textos y Colores</h4>
                    <div>
                      <label className="text-[10px] font-bold uppercase ml-1">Nombre Comercial</label>
                      <input value={tempConfig.storeName} onChange={e => setTempConfig({...tempConfig, storeName: e.target.value})} className="w-full bg-slate-100 p-3 rounded-xl font-bold text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase ml-1">Descripción / Slogan</label>
                      <input value={tempConfig.description} onChange={e => setTempConfig({...tempConfig, description: e.target.value})} className="w-full bg-slate-100 p-3 rounded-xl font-bold text-sm" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] font-bold uppercase">Botones</label>
                        <input type="color" value={tempConfig.buttonColor} onChange={e => setTempConfig({...tempConfig, buttonColor: e.target.value})} className="w-full h-10 bg-white p-1 rounded-lg cursor-pointer border" />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase">Texto BTN</label>
                        <input type="color" value={tempConfig.textColor} onChange={e => setTempConfig({...tempConfig, textColor: e.target.value})} className="w-full h-10 bg-white p-1 rounded-lg cursor-pointer border" />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase">Títulos</label>
                        <input type="color" value={tempConfig.titleColor} onChange={e => setTempConfig({...tempConfig, titleColor: e.target.value})} className="w-full h-10 bg-white p-1 rounded-lg cursor-pointer border" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase ml-1 text-green-600">WhatsApp Receptor</label>
                      <input value={tempConfig.whatsapp} onChange={e => setTempConfig({...tempConfig, whatsapp: e.target.value})} className="w-full bg-green-50 p-3 rounded-xl font-bold text-sm" placeholder="Ej: 584120000000" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase ml-1">Zonas Disponibles (Separadas por coma)</label>
                      <textarea value={tempConfig.zones} onChange={e => setTempConfig({...tempConfig, zones: e.target.value})} className="w-full bg-slate-100 p-3 rounded-xl font-bold text-sm h-20 resize-none" />
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'products' && (
                <div className="space-y-4">
                  <button onClick={() => setTempProducts([{id: Date.now().toString(), name: 'Nuevo Producto', price: '', category: 'General', image: '', status: 'Ninguno'}, ...tempProducts])} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                    + Agregar Producto al Catálogo
                  </button>

                  <div className="grid gap-4">
                    {tempProducts.map((p, idx) => (
                      <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
                        <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center relative shrink-0">
                          {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-300"/>}
                          <label className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (base64) => { const n = [...tempProducts]; n[idx].image = base64; setTempProducts(n); })} className="hidden" />
                            <Plus size={16} className="text-white" />
                          </label>
                        </div>
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
                          <input value={p.name} onChange={e => { const n = [...tempProducts]; n[idx].name = e.target.value; setTempProducts(n); }} className="p-2 bg-white border border-slate-200 rounded-lg font-bold text-xs" placeholder="Nombre" />
                          <input type="number" value={p.price} onChange={e => { const n = [...tempProducts]; n[idx].price = e.target.value; setTempProducts(n); }} className="p-2 bg-white border border-slate-200 rounded-lg font-bold text-xs" placeholder="Precio ($)" />
                          <input value={p.category} onChange={e => { const n = [...tempProducts]; n[idx].category = e.target.value; setTempProducts(n); }} className="p-2 bg-white border border-slate-200 rounded-lg font-bold text-xs" placeholder="Categoría" />
                          
                          {/* Selector de Estado/Etiqueta */}
                          <select 
                            value={p.status || 'Ninguno'} 
                            onChange={e => { const n = [...tempProducts]; n[idx].status = e.target.value; setTempProducts(n); }} 
                            className={`p-2 border border-slate-200 rounded-lg font-bold text-xs appearance-none cursor-pointer outline-none ${p.status === 'Ninguno' || !p.status ? 'bg-white' : 'bg-slate-900 text-white'}`}
                          >
                            <option value="Ninguno">Sin Etiqueta</option>
                            <option value="Destacado">⭐ Destacado</option>
                            <option value="En Promoción">🔥 En Promoción</option>
                            <option value="Quedan Pocos">⚠️ Quedan Pocos</option>
                          </select>
                        </div>
                        <button onClick={() => setTempProducts(tempProducts.filter((_, i) => i !== idx))} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0">
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {settingsTab === 'orders' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-[11px] font-bold flex items-center gap-2">
                    <ClipboardList size={16}/> Historial de clientes que completaron el checkout.
                  </div>
                  {orders.length === 0 ? (
                     <div className="text-center py-20 text-slate-300 font-bold uppercase text-[10px] tracking-widest">No hay registros aún</div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-wider">
                          <tr>
                            <th className="p-4">Ticket</th>
                            <th className="p-4">Fecha</th>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">WhatsApp</th>
                            <th className="p-4">Zona</th>
                            <th className="p-4">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {orders.map((ord, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-4 font-black text-slate-900">#{ord.ticketNumber}</td>
                              <td className="p-4 text-xs text-slate-500">{new Date(ord.date).toLocaleDateString()}</td>
                              <td className="p-4 font-bold text-xs">{ord.client.nombre} {ord.client.apellido}</td>
                              <td className="p-4 text-xs font-mono">{ord.client.whatsapp}</td>
                              <td className="p-4 text-[10px] uppercase font-bold text-slate-500">{ord.client.zona}</td>
                              <td className="p-4 font-black text-green-600">${Number(ord.total).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {settingsTab !== 'orders' && (
              <div className="p-6 border-t bg-slate-50">
                <button onClick={handleSaveSettings} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all">
                  <Save size={18}/> Aplicar y Guardar Cambios
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL LOGIN ADMIN */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Acceso Vendedor</h3>
              <button onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:text-slate-800"><X size={20}/></button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Usuario</label>
                <input type="text" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})} className="w-full bg-slate-100 p-3 rounded-xl font-bold outline-none border-2 border-transparent focus:border-slate-200 transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Contraseña</label>
                <input type="password" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} className="w-full bg-slate-100 p-3 rounded-xl font-bold outline-none border-2 border-transparent focus:border-slate-200 transition-all" />
              </div>
            </div>
            <button onClick={handleAdminLogin} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
              <LogIn size={18}/> Validar Identidad
            </button>
          </div>
        </div>
      )}

      {/* CARRITO */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsCartOpen(false)} />
          <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-8 animate-in slide-in-from-right duration-500">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black uppercase tracking-tighter">Bolsa de Compras</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-200">
                  <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                    <ShoppingCart size={32} />
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-300">Tu bolsa está vacía</span>
                </div>
              ) : cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                  <div className="flex-1">
                    <p className="font-black text-xs uppercase tracking-tight">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="bg-white px-2 py-0.5 rounded-lg border text-[9px] font-black">x{item.qty}</span>
                        <span className="text-slate-400 text-[10px] font-bold">${Number(item.price).toLocaleString()} c/u</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-sm">${(item.price * item.qty).toLocaleString()}</span>
                    <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {cart.length > 0 && !isCheckoutOpen && (
              <div className="pt-8 border-t border-slate-100 mt-auto">
                <div className="flex justify-between items-center mb-6 px-2">
                  <span className="font-black uppercase text-[10px] text-slate-400 tracking-widest">Subtotal</span>
                  <span className="text-3xl font-black tracking-tighter text-slate-900">${cartTotal.toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                  style={{backgroundColor: storeConfig.buttonColor, color: storeConfig.textColor}}
                >
                  <MessageCircle size={20} fill="white" /> Ir al Pago
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CHECKOUT */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsCheckoutOpen(false)}/>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase tracking-tighter" style={{color: storeConfig.titleColor}}>Confirmar Datos</h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={18}/></button>
            </div>
            
            <div className="overflow-y-auto pr-2 pb-6 space-y-4 no-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                  <input required placeholder="Nombre *" value={clientData.nombre} onChange={e => setClientData({...clientData, nombre: e.target.value})} className="w-full bg-slate-50 p-3 pl-9 rounded-xl text-xs font-bold border border-slate-100 outline-none" />
                </div>
                <input required placeholder="Apellido *" value={clientData.apellido} onChange={e => setClientData({...clientData, apellido: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl text-xs font-bold border border-slate-100 outline-none" />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                <input required type="tel" placeholder="WhatsApp *" value={clientData.whatsapp} onChange={e => setClientData({...clientData, whatsapp: e.target.value})} className="w-full bg-slate-50 p-3 pl-9 rounded-xl text-xs font-bold border border-slate-100 outline-none" />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                <input required type="email" placeholder="Email *" value={clientData.email} onChange={e => setClientData({...clientData, email: e.target.value})} className="w-full bg-slate-50 p-3 pl-9 rounded-xl text-xs font-bold border border-slate-100 outline-none" />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                <select required value={clientData.zona} onChange={e => setClientData({...clientData, zona: e.target.value})} className="w-full bg-slate-50 p-3 pl-9 rounded-xl text-xs font-bold border border-slate-100 appearance-none cursor-pointer outline-none">
                  <option value="">Selecciona tu zona *</option>
                  {availableZones.map((z, i) => <option key={i} value={z}>{z}</option>)}
                </select>
                <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
              </div>
              <textarea required placeholder="Dirección detallada y puntos de referencia *" value={clientData.referencia} onChange={e => setClientData({...clientData, referencia: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl text-xs font-bold border border-slate-100 h-24 resize-none outline-none" />
            </div>

            <div className="border-t pt-4 mt-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Tu Ticket</span>
                  <span className="text-xl font-black px-3 py-1 bg-slate-900 text-white rounded-lg">#{String(storeConfig.nextTicket).padStart(3, '0')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Total a Pagar</span>
                  <span className="text-2xl font-black text-green-600">${cartTotal.toLocaleString()}</span>
                </div>
              </div>
              <button 
                onClick={processCheckout}
                className="w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all text-white bg-[#25D366] hover:bg-[#20bd5a]"
              >
                <MessageCircle size={18} fill="white"/> Enviar Pedido vía WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
