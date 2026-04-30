import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";
import { 
  ShoppingCart, X, Plus, Store, MessageCircle, 
  Trash2, Image as ImageIcon, Settings, Save,
  User, MapPin, Mail, Phone, Lock, LogIn, ClipboardList,
  ChevronRight, Palette, Layout, PhoneCall, Key, Package
} from 'lucide-react';

// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'tienda-premium';
const cleanAppId = rawAppId.replace(/[^a-zA-Z0-9_-]/g, '_'); 

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('info'); 
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
    description: 'Catálogo exclusivo de productos seleccionados',
    adminUser: 'admin',
    adminPass: '1234'
  });

  const [tempConfig, setTempConfig] = useState({...storeConfig});
  const [tempProducts, setTempProducts] = useState([]);

  // --- REGLA 3: Autenticación antes de Consultas ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Error de autenticación:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- REGLA 1 y 2: Consultas seguras tras Auth ---
  useEffect(() => {
    if (!user) return;

    // Ruta estricta siguiendo REGLA 1
    const docRef = doc(db, 'artifacts', cleanAppId, 'public', 'data', 'store', 'main');
    
    // onSnapshot con manejador de error para evitar fallos silenciosos
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
      console.error("Error en snapshot listener:", error);
    });

    return () => unsub();
  }, [user]);

  const handleAdminLogin = () => {
    if (loginForm.user === storeConfig.adminUser && loginForm.pass === storeConfig.adminPass) {
      setIsAdminLoggedIn(true);
      setShowLoginModal(false);
      setTempConfig({...storeConfig});
      setTempProducts([...products]);
      setIsSettingsOpen(true);
      setLoginForm({user: '', pass: ''});
    } else {
      // Usar UI personalizada en lugar de alert()
      console.warn("Acceso denegado");
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', cleanAppId, 'public', 'data', 'store', 'main');
    try {
      await setDoc(docRef, { config: tempConfig, products: tempProducts }, { merge: true });
      setIsSettingsOpen(false);
    } catch (err) { 
      console.error("Error al guardar:", err); 
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      
      {/* HEADER PRINCIPAL */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-lg overflow-hidden" style={{backgroundColor: storeConfig.buttonColor}}>
            {storeConfig.logo ? <img src={storeConfig.logo} alt="Logo" className="w-full h-full object-cover" /> : <Store size={20} />}
          </div>
          <h1 className="text-xl font-black tracking-tight uppercase" style={{color: storeConfig.titleColor}}>{storeConfig.storeName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => isAdminLoggedIn ? setIsSettingsOpen(true) : setShowLoginModal(true)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-colors">
            {isAdminLoggedIn ? <Settings size={20}/> : <Lock size={20}/>}
          </button>
          <button onClick={() => setIsCartOpen(true)} className="h-11 px-5 rounded-xl flex items-center gap-2 shadow-xl text-white font-bold text-xs uppercase" style={{backgroundColor: storeConfig.buttonColor}}>
            <ShoppingCart size={16} />
            <span>({cart.length})</span>
          </button>
        </div>
      </nav>

      {/* BANNER */}
      <header className="max-w-7xl mx-auto px-6 mt-6">
        <div className="rounded-[2.5rem] h-64 relative overflow-hidden shadow-2xl flex flex-col items-center justify-center text-center">
          {storeConfig.heroImage ? <img src={storeConfig.heroImage} alt="Banner" className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 bg-slate-900" />}
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 text-white">
            <h2 className="text-4xl font-black uppercase mb-2 tracking-tighter">{storeConfig.storeName}</h2>
            <p className="text-slate-200 text-[10px] font-black uppercase tracking-[0.2em]">{storeConfig.description}</p>
          </div>
        </div>
      </header>

      {/* FILTRO CATEGORIAS */}
      <div className="max-w-7xl mx-auto px-6 mt-8 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeCategory === cat ? 'border-transparent shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`} style={activeCategory === cat ? { backgroundColor: storeConfig.buttonColor, color: storeConfig.textColor } : {}}>
            {cat}
          </button>
        ))}
      </div>

      {/* GRID PRODUCTOS */}
      <main className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-2 md:grid-cols-4 gap-6 pb-20">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-300">
            <Package size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-black text-[10px] uppercase tracking-widest">No hay productos disponibles</p>
          </div>
        ) : filteredProducts.map((p, idx) => (
          <div key={idx} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-2 flex flex-col group">
            <div className="aspect-square bg-slate-50 rounded-[1.5rem] overflow-hidden">
              {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><ImageIcon size={30}/></div>}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">{p.category}</span>
              <h3 className="font-bold text-sm mb-4 line-clamp-1">{p.name}</h3>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-lg font-black">${Number(p.price).toLocaleString()}</span>
                <button onClick={() => addToCart(p)} className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-transform" style={{backgroundColor: storeConfig.buttonColor, color: storeConfig.textColor}}>
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* BOTON WHATSAPP */}
      <a href={`https://wa.me/${storeConfig.whatsapp}`} target="_blank" rel="noreferrer" className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl z-50">
        <MessageCircle size={28} fill="white" />
      </a>

      {/* MODAL CONFIGURACIÓN */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in duration-300">
            <aside className="w-full md:w-72 bg-slate-50 border-r border-slate-100 p-8 flex flex-col gap-2">
              <div className="mb-8">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Panel de Control</h3>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Configuración</p>
              </div>
              
              <button onClick={() => setSettingsTab('info')} className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${settingsTab === 'info' ? 'bg-white shadow-xl text-slate-900' : 'text-slate-400 hover:bg-slate-100'}`}>
                <Layout size={16} /> Información
              </button>
              
              <button onClick={() => setSettingsTab('style')} className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${settingsTab === 'style' ? 'bg-white shadow-xl text-slate-900' : 'text-slate-400 hover:bg-slate-100'}`}>
                <Palette size={16} /> Estética
              </button>
              
              <button onClick={() => setSettingsTab('whatsapp')} className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${settingsTab === 'whatsapp' ? 'bg-white shadow-xl text-slate-900' : 'text-slate-400 hover:bg-slate-100'}`}>
                <PhoneCall size={16} /> WhatsApp
              </button>
              
              <button onClick={() => setSettingsTab('products')} className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${settingsTab === 'products' ? 'bg-white shadow-xl text-slate-900' : 'text-slate-400 hover:bg-slate-100'}`}>
                <Package size={16} /> Productos
              </button>
              
              <button onClick={() => setSettingsTab('access')} className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${settingsTab === 'access' ? 'bg-white shadow-xl text-slate-900' : 'text-slate-400 hover:bg-slate-100'}`}>
                <Key size={16} /> Acceso
              </button>

              <button onClick={handleSaveSettings} className="mt-auto flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                <Save size={16} /> Guardar Cambios
              </button>
            </aside>

            <div className="flex-1 p-10 overflow-y-auto relative bg-white">
              <button onClick={() => setIsSettingsOpen(false)} className="absolute top-8 right-8 p-3 text-slate-300 hover:text-red-500 transition-colors">
                <X size={24}/>
              </button>

              <div className="max-w-2xl">
                {settingsTab === 'info' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <h4 className="text-2xl font-black uppercase tracking-tighter mb-8">Información de la Tienda</h4>
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Nombre Comercial</label>
                      <input value={tempConfig.storeName} onChange={e => setTempConfig({...tempConfig, storeName: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none font-bold text-sm" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Descripción o Slogan</label>
                      <textarea value={tempConfig.description} onChange={e => setTempConfig({...tempConfig, description: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none font-bold text-sm h-32 resize-none" />
                    </div>
                  </div>
                )}

                {settingsTab === 'style' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <h4 className="text-2xl font-black uppercase tracking-tighter mb-8">Personalización</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Color Primario</label>
                        <input type="color" value={tempConfig.buttonColor} onChange={e => setTempConfig({...tempConfig, buttonColor: e.target.value})} className="w-full h-14 rounded-2xl cursor-pointer border-none" />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Color Títulos</label>
                        <input type="color" value={tempConfig.titleColor} onChange={e => setTempConfig({...tempConfig, titleColor: e.target.value})} className="w-full h-14 rounded-2xl cursor-pointer border-none" />
                      </div>
                    </div>
                    <div className="p-8 border-2 border-dashed border-slate-100 rounded-[2rem] text-center bg-slate-50/50">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Logo de Marca (Imagen)</p>
                      <input type="file" accept="image/*" id="logo-input" className="hidden" onChange={e => {
                        const r = new FileReader();
                        r.onload = () => setTempConfig({...tempConfig, logo: r.result});
                        r.readAsDataURL(e.target.files[0]);
                      }} />
                      <label htmlFor="logo-input" className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:shadow-lg inline-block">
                        Subir Imagen
                      </label>
                      {tempConfig.logo && <img src={tempConfig.logo} alt="Previsualización Logo" className="h-16 mx-auto mt-6 rounded-lg shadow-sm" />}
                    </div>
                  </div>
                )}

                {settingsTab === 'whatsapp' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <h4 className="text-2xl font-black uppercase tracking-tighter mb-8">WhatsApp</h4>
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Número de Enlace</label>
                      <input value={tempConfig.whatsapp} onChange={e => setTempConfig({...tempConfig, whatsapp: e.target.value})} placeholder="Ej: 5491100000000" className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none font-bold text-sm" />
                    </div>
                    <p className="text-[10px] font-bold text-blue-500 bg-blue-50 p-4 rounded-xl leading-relaxed uppercase tracking-wider">Asegúrese de incluir código de país sin el símbolo +. Ejemplo: 54911...</p>
                  </div>
                )}

                {settingsTab === 'products' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <h4 className="text-2xl font-black uppercase tracking-tighter">Inventario</h4>
                    <button onClick={() => setTempProducts([{id: Date.now(), name: 'Nuevo Item', price: '0', category: 'General', image: ''}, ...tempProducts])} className="w-full py-5 border-2 border-dashed border-slate-200 rounded-2xl font-black text-[10px] uppercase text-slate-400 hover:text-slate-900 transition-all">
                      + Añadir Producto
                    </button>
                    <div className="space-y-3">
                      {tempProducts.map((p, i) => (
                        <div key={p.id} className="flex gap-4 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                            {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><ImageIcon size={16}/></div>}
                          </div>
                          <input value={p.name} onChange={e => { const n = [...tempProducts]; n[i].name = e.target.value; setTempProducts(n); }} className="flex-1 p-2 bg-transparent font-bold text-xs outline-none" />
                          <input value={p.price} onChange={e => { const n = [...tempProducts]; n[i].price = e.target.value; setTempProducts(n); }} className="w-20 p-2 bg-transparent font-bold text-xs outline-none text-right" />
                          <button onClick={() => setTempProducts(tempProducts.filter(x => x.id !== p.id))} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {settingsTab === 'access' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <h4 className="text-2xl font-black uppercase tracking-tighter mb-8">Seguridad</h4>
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Usuario</label>
                      <input value={tempConfig.adminUser} onChange={e => setTempConfig({...tempConfig, adminUser: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none font-bold text-sm" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Clave</label>
                      <input type="password" value={tempConfig.adminPass} onChange={e => setTempConfig({...tempConfig, adminPass: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none font-bold text-sm" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-900">
              <Lock size={28} />
            </div>
            <h3 className="text-xl font-black uppercase mb-6 tracking-tight">Admin Login</h3>
            <div className="space-y-4">
              <input placeholder="Usuario" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" />
              <input type="password" placeholder="Contraseña" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" />
              <button onClick={handleAdminLogin} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Ingresar</button>
              <button onClick={() => setShowLoginModal(false)} className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-4">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* CARRITO */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-8 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black uppercase tracking-tighter">Mi Carrito</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-200">
                  <ShoppingCart size={48} />
                  <span className="mt-4 font-black text-[10px] uppercase tracking-widest">Vacío</span>
                </div>
              ) : cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
                  <div>
                    <p className="font-black text-xs uppercase">{item.name}</p>
                    <p className="font-bold text-slate-400 text-[10px]">x{item.qty} - ${Number(item.price).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-sm">${(item.price * item.qty).toLocaleString()}</span>
                    <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="pt-8 border-t mt-auto">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-black uppercase text-[10px] text-slate-400 tracking-widest">Subtotal</span>
                  <span className="text-3xl font-black tracking-tighter">${cartTotal.toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => {
                    const txt = cart.map(i => `- ${i.name} (x${i.qty})`).join('%0A');
                    window.open(`https://wa.me/${storeConfig.whatsapp}?text=Hola! Pedido:%0A%0A${txt}%0A%0ATotal: $${cartTotal.toLocaleString()}`, '_blank');
                  }}
                  className="w-full py-5 bg-[#25D366] text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} fill="white" /> Pedir por WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
