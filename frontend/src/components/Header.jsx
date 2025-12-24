import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton, useCurrentAccount, useConnectWallet, useWallets, useSuiClient } from '@mysten/dapp-kit';
import { LayoutGrid, User, Upload, Activity, Bell, TrendingUp, TrendingDown, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PACKAGE_ID = "0x5e4414f266147c07b0b15ded6239606c78333628b4fe251b1dbaa7600c637675";

export default function Header({ scrolled }) {
  const account = useCurrentAccount();
  const location = useLocation();
  const wallets = useWallets();
  const client = useSuiClient();
  const { mutate: connect } = useConnectWallet();

  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [lastEventId, setLastEventId] = useState(null);

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 1. FIX: Reset thông báo khi đổi ví hoặc Logout
  useEffect(() => {
    setNotifications([]);
    setLastEventId(null);
    setShowNotifs(false);
  }, [account?.address]);

  // 2. Logic lấy và lọc sự kiện (Chỉ lấy liên quan đến ví hiện tại)
  const fetchEvents = useCallback(async () => {
    if (!account?.address) return;

    try {
      const events = await client.queryEvents({
        query: { MoveEventType: `${PACKAGE_ID}::charity_auction::BidPlaced` },
        limit: 20, // Lấy nhiều hơn một chút để lọc
        order: 'descending',
      });

      if (events.data && events.data.length > 0) {
        const myAddress = account.address;

        // Lọc sự kiện: 
        // - Tôi là người đặt thầu (You placed a bid)
        // - HOẶC Người thắng trước đó là tôi (You were outbid) -> Cần check field này trong contract nếu có
        const filteredEvents = events.data.filter(event => {
          const bidData = event.parsedJson;
          return bidData.bidder === myAddress;
          // Nếu contract của bạn có field 'previous_bidder', hãy thêm: || bidData.previous_bidder === myAddress
        });

        const formattedNotifs = filteredEvents.map((event, index) => {
          const bidData = event.parsedJson;
          const currentBid = Number(bidData.bid_amount || bidData.amount || 0) / 1e9;

          return {
            id: event.id.txDigest,
            bidder: bidData.bidder,
            amount: currentBid.toFixed(2),
            // Nếu tôi là bidder thì là Up (thông báo đặt thành công)
            isUp: true,
            time: new Date(Number(event.timestampMs)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isNew: lastEventId !== null && event.id.txDigest !== lastEventId && index === 0
          };
        });

        setNotifications(formattedNotifs);
        if (events.data[0]) setLastEventId(events.data[0].id.txDigest);
      }
    } catch (err) {
      console.error("Lỗi fetch thông báo:", err);
    }
  }, [client, account?.address, lastEventId]);

  useEffect(() => {
    fetchEvents();
    const timer = setInterval(fetchEvents, 15000);
    return () => clearInterval(timer);
  }, [fetchEvents]);

  const toggleNotifs = () => {
    if (!showNotifs) {
      setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
    }
    setShowNotifs(!showNotifs);
  };

  const handleConnectSlush = () => {
    const slushWallet = wallets.find(w => w.name.toLowerCase().includes('slush'));
    if (slushWallet) connect({ wallet: slushWallet });
    else {
      alert("Vui lòng cài đặt Slush Wallet!");
      window.open("https://slush.pet/", "_blank");
    }
  };

  return (
    <nav className={`fixed top-0 w-full z-[9999] transition-all duration-500 ${scrolled ? 'bg-[#050B18]/90 backdrop-blur-2xl border-b border-white/5 py-3' : 'bg-transparent py-6'
      }`}>
      <div className="max-w-7xl mx-auto px-10 flex justify-between items-center">

        {/* LOGO */}
        <Link to="/" className="flex flex-col group relative z-10">
          <span className="text-2xl font-black italic tracking-tighter text-white">
            SUI<span className="text-sui-cyan drop-shadow-[0_0_10px_#00D1FF]">CHARITY</span>
          </span>
          <span className="text-[7px] font-black text-white/30 tracking-[0.4em] uppercase leading-none">Impact Protocol</span>
        </Link>

        {/* NAVIGATION */}
        <div className="hidden md:flex gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl relative z-10">
          {[
            { path: '/', label: 'Trang chủ', icon: null },
            { path: '/explore', label: 'Đấu giá', icon: <LayoutGrid size={14} /> },
            { path: '/create', label: 'Đăng bán', icon: <Upload size={14} /> },
            { path: '/profile', label: 'Cá nhân', icon: <User size={14} /> },
          ].map((link) => (
            <Link key={link.path} to={link.path} className={`relative px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${location.pathname === link.path ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}>
              {location.pathname === link.path && (
                <motion.div layoutId="nav-bg" className="absolute inset-0 bg-sui-cyan/20 border border-sui-cyan/50 rounded-xl" />
              )}
              <span className="relative z-10 flex items-center gap-2">{link.icon} {link.label}</span>
            </Link>
          ))}
        </div>

        {/* ACTIONS SECTION */}
        <div className="flex items-center gap-4 relative z-20">
          {account && (
            <div className="relative">
              <button
                onClick={toggleNotifs}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-sui-cyan hover:border-sui-cyan/50 transition-all relative cursor-pointer"
              >
                <Bell size={18} />
                {notifications.some(n => n.isNew) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-sui-cyan rounded-full animate-ping" />
                )}
              </button>

              <AnimatePresence>
                {showNotifs && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 bg-[#0A1120]/98 backdrop-blur-3xl border border-white/10 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100]"
                  >
                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Hoạt động của tôi</h4>
                      <Activity size={12} className="text-sui-cyan" />
                    </div>

                    <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar">
                      {notifications.length > 0 ? notifications.map((notif) => (
                        <div key={notif.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 flex gap-3 items-center group hover:bg-white/10 transition-all">
                          <div className="p-2 rounded-lg bg-sui-cyan/10 text-sui-cyan">
                            <TrendingUp size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-white/90">Bạn đã đặt thầu thành công</p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-sui-cyan font-black text-[10px]">{notif.amount} SUI</span>
                              <span className="text-[8px] text-white/20 uppercase font-black"><Clock size={8} className="inline mr-1" />{notif.time}</span>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8">
                          <AlertCircle size={20} className="mx-auto text-white/10 mb-2" />
                          <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">Không có hoạt động nào</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* WALLET BUTTON */}
          <div className="flex items-center gap-4 border-l border-white/10 pl-4">
            {account ? (
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-[9px] font-black text-sui-cyan uppercase tracking-widest flex items-center gap-1.5">
                    <Activity size={10} className="animate-pulse" /> Live
                  </span>
                  <span className="text-[10px] font-mono text-white/40 font-bold tracking-tighter">
                    {formatAddress(account.address)}
                  </span>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-sui-cyan/30 blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <ConnectButton />
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleConnectSlush}
                className="bg-sui-cyan text-sui-dark px-8 py-2.5 rounded-xl border border-sui-cyan/50 text-[11px] font-black uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all cursor-pointer relative z-10"
              >
                Connect Slush
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}