/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ticket, 
  CreditCard, 
  Banknote, 
  Trash2, 
  X, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  Bus, 
  History,
  Settings as SettingsIcon,
  ChevronRight,
  Printer,
  ChevronLeft,
  Plus,
  Save,
  ShoppingCart,
  Volume2
} from 'lucide-react';
import { TICKETS, STOPS, LINE_INFO, TicketType } from './constants';

interface CartItem extends TicketType {
  quantity: number;
}

interface AppConfig {
  lineNumber: string;
  destination: string;
  stops: string[];
}

export default function App() {
  // Driver state
  const [driver, setDriver] = useState<{name: string, loginTime: string} | null>(() => {
    const saved = localStorage.getItem('synergy_driver');
    return saved ? JSON.parse(saved) : null;
  });

  // Persistence state
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('synergy_config');
    return saved ? JSON.parse(saved) : {
      lineNumber: LINE_INFO.number,
      destination: LINE_INFO.destination,
      stops: STOPS
    };
  });

  // Navigation state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  
  // Audio system ref
  const audioCtxRef = React.useRef<AudioContext | null>(null);

  const [transactionHistory, setTransactionHistory] = useState<{ id: string; total: number; time: string }[]>(() => {
    const saved = localStorage.getItem('synergy_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Settings form state (using raw string for stops to allow easy editing)
  const [tempConfig, setTempConfig] = useState<AppConfig>(config);
  const [stopsText, setStopsText] = useState<string>('');

  const playSound = (freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.1) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.log("Audio error", e);
    }
  };

  const playPaymentSound = () => {
    playSound(880, 0.1, 'sine', 0.1);
    setTimeout(() => playSound(1046.5, 0.3, 'sine', 0.1), 100);
  };
  
  const playBeepSound = () => playSound(400, 0.5, 'square', 0.05);

  useEffect(() => {
    localStorage.setItem('synergy_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('synergy_history', JSON.stringify(transactionHistory));
  }, [transactionHistory]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDriverLogin = (name: string) => {
    if(!name.trim()) return;
    const d = { name: name.trim(), loginTime: new Date().toLocaleTimeString('cs-CZ') };
    setDriver(d);
    localStorage.setItem('synergy_driver', JSON.stringify(d));
  };

  const handleLogout = () => {
    localStorage.removeItem('synergy_driver');
    setDriver(null);
    setShowSettings(false);
  };

  const addToCart = (ticket: TicketType) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === ticket.id);
      if (existing) {
        return prev.map(item => 
          item.id === ticket.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...ticket, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string, all: boolean = false) => {
    setCart(prev => {
      if (all) return prev.filter(item => item.id !== id);
      return prev.map(item => {
        if (item.id === id) {
          if (item.quantity > 1) return { ...item, quantity: item.quantity - 1 };
          return null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePayment = (method: 'cash' | 'card') => {
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      setPaymentSuccess(true);
      playPaymentSound();
      const newTransaction = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        total,
        time: new Date().toLocaleString('cs-CZ'),
      };
      setTransactionHistory(prev => [newTransaction, ...prev].slice(0, 50));
      
      setTimeout(() => {
        setPaymentSuccess(false);
        clearCart();
        setShowMobileCart(false);
      }, 2000);
    }, 1500);
  };

  const nextStop = () => {
    playBeepSound();
    setCurrentStopIndex(prev => (prev + 1) % config.stops.length);
  };

  const playAnnouncement = () => {
    const currentStop = config.stops[currentStopIndex] || '';
    const nextStopName = config.stops[(currentStopIndex + 1) % config.stops.length] || '';
    
    const isRequestStop = (name: string) => name.toLowerCase().includes('(z)') || name.toLowerCase().includes('na znamení');
    
    let text = `Zastávka: ${currentStop.replace(/\(z\)/gi, '')}.`;
    if (isRequestStop(currentStop)) text += " Tato zastávka je na znamení.";
    
    text += ` Příští zastávka: ${nextStopName.replace(/\(z\)/gi, '')}.`;
    if (isRequestStop(nextStopName)) text += " Příští zastávka bude na znamení.";
    
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'cs-CZ';
    msg.pitch = 0.85; 
    msg.rate = 0.9;
    
    const voices = window.speechSynthesis.getVoices();
    const maleVoice = voices.find(v => v.lang.includes('cs') && (v.name.toLowerCase().includes('jakub') || v.name.toLowerCase().includes('matej') || v.name.toLowerCase().includes('male')));
    if (maleVoice) msg.voice = maleVoice;
    
    window.speechSynthesis.speak(msg);
  };

  const saveSettings = () => {
    const finalStops = stopsText.split('>').map(s => s.trim()).filter(Boolean);
    const finalConfig = { ...tempConfig, stops: finalStops };
    setConfig(finalConfig);
    setShowSettings(false);
    setCurrentStopIndex(0);
  };

  // Render Login Screen if no driver
  if (!driver) {
    return (
      <div className="fixed inset-0 bg-[#0d0d0d] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_#1a1a1a_0%,_#000_100%)]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-[#161616] p-8 rounded-[3rem] border border-[#222] shadow-2xl flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Bus size={40} className="text-white" />
          </div>
          <h1 className="text-center font-black text-white text-2xl tracking-tighter mb-1 uppercase">Synergy OCC</h1>
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-8">Příhlášení řidiče</p>
          
          <div className="w-full space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-600 uppercase mb-2 block px-1">Profil řidiče</label>
              <input 
                id="driver-input"
                type="text" 
                placeholder="Zadejte jméno nebo ID"
                className="w-full bg-[#111] p-5 rounded-2xl border border-[#333] outline-none font-bold text-white focus:border-emerald-500 transition-all text-center"
                onKeyDown={(e) => e.key === 'Enter' && handleDriverLogin((e.target as HTMLInputElement).value)}
              />
            </div>
            
            <button 
              onClick={() => {
                const val = (document.getElementById('driver-input') as HTMLInputElement).value;
                handleDriverLogin(val);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 py-5 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"
            >
              SPUSTIT SYSTÉM
            </button>
          </div>
          
          <p className="mt-8 text-[9px] text-gray-700 font-bold uppercase tracking-tighter">AI Studio Build v4.2</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] text-white font-sans selection:bg-emerald-500/30 flex flex-col overflow-hidden md:touch-auto">
      {/* --- TOP STATUS BAR --- */}
      <header className="h-14 md:h-16 bg-[#161616] border-b border-[#222] flex items-center justify-between px-3 md:px-4 shadow-xl z-30 shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="bg-emerald-600 px-2 py-1 rounded font-black text-base md:text-xl flex items-center gap-1 md:gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Bus size={18} />
            {config.lineNumber}
          </div>
          <div className="flex flex-col overflow-hidden max-w-[100px] md:max-w-none">
            <span className="text-[8px] md:text-[10px] uppercase tracking-wider text-gray-500 font-bold">Směr</span>
            <span className="text-xs md:text-sm font-bold truncate leading-tight">{config.destination}</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 bg-black/40 px-4 py-2 rounded-lg border border-[#333]">
          <div className="flex items-center gap-2 text-emerald-400">
            <MapPin size={16} />
            <span className="text-sm font-bold truncate max-w-[120px]">{config.stops[currentStopIndex]}</span>
          </div>
          <ChevronRight size={12} className="text-gray-600" />
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-xs">{config.stops[(currentStopIndex + 1) % config.stops.length]}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-500 font-mono hidden md:inline">{currentTime.toLocaleDateString('cs-CZ')}</span>
            <span className="text-sm md:text-lg font-mono font-black text-emerald-500">
              {currentTime.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
              <span className="text-xs opacity-50 ml-1 hidden md:inline">{currentTime.getSeconds().toString().padStart(2, '0')}</span>
            </span>
          </div>
          <button 
            onClick={() => {
              setTempConfig(config);
              setStopsText(config.stops.join('>'));
              setShowSettings(true);
            }}
            className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#222] flex items-center justify-center text-gray-400 hover:text-white cursor-pointer transition-all border border-[#333] active:scale-90"
          >
            <SettingsIcon size={18} />
          </button>
        </div>
      </header>

      {/* --- AUDIO ACTIVATION OVERLAY (Crucial for mobile) --- */}
      {!audioCtxRef.current && (
        <div 
          onClick={() => {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioCtxRef.current.resume();
          }}
          className="fixed inset-0 z-0"
        />
      )}

      {/* --- MOBILE STOP INFO --- */}
      <div className="md:hidden bg-black/60 px-3 py-2 border-b border-[#222] flex items-center justify-between">
        <div className="flex items-center gap-3 text-emerald-400 overflow-hidden">
          <button 
            onClick={playAnnouncement}
            className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          >
            <Volume2 size={16} />
          </button>
          <div className="flex flex-col">
            <span className="text-[8px] text-gray-500 uppercase font-black">Příští zastávka</span>
            <span className="text-xs font-bold truncate">{config.stops[currentStopIndex]}</span>
          </div>
        </div>
        <button onClick={nextStop} className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Další</button>
      </div>

      <main className="flex-1 flex overflow-hidden relative">
        {/* --- LEFT: Ticket Selection --- */}
        <section className="flex-1 p-3 md:p-4 overflow-y-auto custom-scrollbar pb-24 md:pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {TICKETS.map(ticket => (
              <motion.button
                key={ticket.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => addToCart(ticket)}
                className={`${ticket.color} p-3 md:p-4 rounded-xl shadow-lg border border-white/10 flex flex-col justify-between h-24 md:h-32 text-left relative overflow-hidden group`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs md:text-sm leading-tight pr-2">{ticket.name}</span>
                  <Ticket size={14} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[8px] md:text-[10px] opacity-60 uppercase font-black">{ticket.category}</span>
                  <span className="text-lg md:text-2xl font-black">{ticket.price} <span className="text-[10px] md:text-sm font-normal">Kč</span></span>
                </div>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors pointer-events-none" />
              </motion.button>
            ))}
          </div>

          <div className="mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
             <button 
              onClick={nextStop}
              className="bg-[#1a1a1a] hover:bg-[#222] p-3 md:p-4 rounded-xl border border-[#333] flex items-center gap-3 transition-colors group active:scale-95"
             >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all">
                  <MapPin size={20} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[8px] md:text-[10px] text-gray-500 uppercase font-bold">Aktuální poloha</span>
                  <span className="text-xs md:text-sm font-bold">Příští zastávka</span>
                </div>
             </button>
             <button 
              onClick={() => setShowHistory(true)}
              className="bg-[#1a1a1a] hover:bg-[#222] p-3 md:p-4 rounded-xl border border-[#333] flex items-center gap-3 transition-colors group active:scale-95"
             >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-black transition-all">
                  <History size={20} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[8px] md:text-[10px] text-gray-500 uppercase font-bold">Evidence</span>
                  <span className="text-xs md:text-sm font-bold">Historie prodeje</span>
                </div>
             </button>
          </div>
        </section>

        {/* --- RIGHT/MOBILE: Cart --- */}
        <aside className={`
          fixed inset-y-0 right-0 w-full sm:w-80 md:w-96 bg-[#121212] border-l border-[#222] flex flex-col shadow-2xl z-40 transition-transform duration-300 ease-in-out
          ${showMobileCart ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:relative'}
        `}>
          <div className="p-4 border-b border-[#222] flex justify-between items-center bg-[#1a1a1a]">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowMobileCart(false)}
                className="md:hidden p-2 text-gray-400"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="font-black text-sm tracking-widest flex items-center gap-2">
                <ShoppingCart size={16} className="text-emerald-500" />
                KOŠÍK
              </h2>
            </div>
            <button 
              onClick={clearCart}
              className="p-2 text-gray-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-black/20">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-700 gap-4">
                <Ticket size={48} strokeWidth={1} />
                <p className="text-xs font-bold uppercase tracking-widest">Prázdný</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {cart.map(item => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-[#1a1a1a] p-3 rounded-xl border border-[#222] flex justify-between items-center group relative overflow-hidden"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-xs">{item.name}</span>
                      <span className="text-[10px] text-emerald-500 font-mono mt-0.5">
                        {item.quantity}× {item.price} Kč
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-[#222] rounded-lg border border-[#333]">
                        <button onClick={() => removeFromCart(item.id)} className="px-3 py-1 font-bold text-gray-400">-</button>
                        <span className="px-1 text-xs font-black min-w-[20px] text-center">{item.quantity}</span>
                        <button onClick={() => addToCart(item)} className="px-3 py-1 font-bold text-emerald-500">+</button>
                      </div>
                      <span className="font-black text-sm min-w-[50px] text-right">{item.price * item.quantity} Kč</span>
                    </div>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.color}`} />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          <div className="p-4 bg-[#1a1a1a] border-t border-[#222] space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-gray-500 font-black uppercase text-[10px]">Celkem</span>
              <span className="text-3xl font-black text-emerald-500 leading-none">{total} <span className="text-xs font-medium">Kč</span></span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button 
                disabled={cart.length === 0}
                onClick={() => handlePayment('cash')}
                className="bg-[#222] hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-20 transition-all p-3 rounded-xl flex flex-col items-center gap-1 group border border-[#333]"
              >
                <Banknote size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-black text-[9px] uppercase tracking-tighter">Hotovost</span>
              </button>
              <button 
                disabled={cart.length === 0}
                onClick={() => handlePayment('card')}
                className="bg-[#222] hover:bg-sky-600 active:bg-sky-700 disabled:opacity-20 transition-all p-3 rounded-xl flex flex-col items-center gap-1 group border border-[#333]"
              >
                <CreditCard size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-black text-[9px] uppercase tracking-tighter">Karta / NFC</span>
              </button>
            </div>
          </div>
        </aside>
      </main>

      {/* --- FOOTER: Mobile Actions --- */}
      <footer className="md:hidden h-16 bg-[#1a1a1a] border-t border-[#222] flex items-center px-3 gap-3 shrink-0">
        <button 
          onClick={() => setShowMobileCart(true)}
          className="flex-1 bg-emerald-600 h-10 rounded-lg flex items-center justify-center gap-2 font-black text-sm relative active:scale-95 transition-transform"
        >
          <ShoppingCart size={18} />
          KOŠÍK
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-1 bg-white text-emerald-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-emerald-600">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          )}
        </button>
        <div className="bg-[#222] h-10 px-4 rounded-lg flex items-center font-black text-emerald-500 border border-[#333]">
          {total} Kč
        </div>
      </footer>

      {/* --- SETTINGS MODAL --- */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#1a1a1a] w-full max-w-lg rounded-2xl border border-[#333] shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-[#333] flex justify-between items-center">
                <h2 className="font-black flex items-center gap-2">
                  <SettingsIcon className="text-emerald-500" size={18} />
                  KONFIGURACE KASY
                </h2>
                <button onClick={() => setShowSettings(false)} className="p-2 text-gray-500"><X size={20}/></button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  <div className="bg-[#222] p-4 rounded-xl border border-[#333] flex items-center justify-between">
                    <div>
                      <label className="block text-[8px] font-black text-gray-500 uppercase">Aktuálně přihlášen</label>
                      <span className="text-xs font-bold text-emerald-500">{driver?.name}</span>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black border border-red-500/20 transition-all uppercase"
                    >
                      Odhlásit
                    </button>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Číslo linky</label>
                    <input 
                      type="text" 
                      value={tempConfig.lineNumber}
                      onChange={e => setTempConfig({...tempConfig, lineNumber: e.target.value})}
                      className="w-full bg-[#222] border border-[#333] rounded-lg p-3 text-emerald-500 font-black outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Cílová stanice</label>
                    <input 
                      type="text" 
                      value={tempConfig.destination}
                      onChange={e => setTempConfig({...tempConfig, destination: e.target.value})}
                      className="w-full bg-[#222] border border-[#333] rounded-lg p-3 text-white font-bold outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Zastávky (oddělené znakem &gt;)</label>
                    <textarea 
                      value={stopsText}
                      onChange={e => setStopsText(e.target.value)}
                      placeholder="Např: Hlavní nádraží>Česká>Technologický park"
                      className="w-full bg-[#222] border border-[#333] rounded-lg p-3 text-gray-300 text-xs outline-none focus:border-emerald-500 h-32 leading-relaxed"
                    />
                    <p className="text-[9px] text-gray-600 mt-1 italic">* Názvy odděluj pomocí {'>'} (např. Divadlo{'>'}Kino)</p>
                  </div>
                </div>

                <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex items-start gap-3">
                  <Printer size={16} className="text-emerald-500 mt-1" />
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Nastavení se ukládá lokálně ve vašem prohlížeči. Při exportu na GitHub zůstane k dispozici po prvním spuštění.
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-[#333] flex gap-3">
                <button 
                  onClick={saveSettings}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Save size={18} /> ULOŽIT PŘEDVOLBU
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Processing Overlay */}
      <AnimatePresence>
        {isPaying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-center"
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="space-y-6">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full mx-auto"
              />
              <h2 className="text-xl font-black uppercase tracking-tight">Probíhá autorizace...</h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Banner */}
      <AnimatePresence>
        {paymentSuccess && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 bg-emerald-500 z-[110] p-4 flex items-center justify-center gap-3 shadow-2xl"
          >
            <CheckCircle2 size={24} />
            <span className="font-black uppercase tracking-widest text-sm">Transakce úspěšná - Tisknu</span>
          </motion.div>
        )}
      </AnimatePresence>

       {/* History Modal */}
       <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex justify-end"
            onClick={() => setShowHistory(false)}
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-md bg-[#161616] h-full shadow-2xl border-l border-[#222] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-[#222] flex justify-between items-center">
                <h2 className="text-lg font-black flex items-center gap-2">
                  <History className="text-emerald-500" />
                  LOG TRANSAKCÍ
                </h2>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-[#222] rounded-full"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {transactionHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-50">
                    <History size={64} />
                    <p className="mt-4 font-black uppercase text-xs">Žádná data</p>
                  </div>
                ) : (
                  transactionHistory.map(h => (
                    <div key={h.id} className="bg-[#1f1f1f] p-3 rounded-xl border border-[#222] flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-mono">#{h.id}</span>
                        <span className="text-xs font-bold text-gray-400">{h.time}</span>
                      </div>
                      <span className="text-lg font-black text-emerald-500">{h.total} Kč</span>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 bg-black/40 border-t border-[#222]">
                 <button 
                  onClick={() => {
                    setTransactionHistory([]);
                    localStorage.removeItem('synergy_history');
                  }}
                  className="w-full py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-black transition-all"
                 >
                   VYMAZAT HISTORII
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>
    </div>
  );
}
