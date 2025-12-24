import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ConnectButton,
  useCurrentAccount,
  useSuiClient
} from '@mysten/dapp-kit';
import {
  LayoutGrid, User, Upload, Activity, Bell,
  TrendingUp, TrendingDown, Clock, Wallet, Menu, X, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PACKAGE_ID = "0x5e4414f266147c07b0b15ded6239606c78333628b4fe251b1dbaa7600c637675";

export default function Header({ scrolled }) {
  const account = useCurrentAccount();
  const location = useLocation();
  const client = useSuiClient();

  const [showNotifs, setShowNotifs] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [lastEventId, setLastEventId] = useState(null);
  const [balance, setBalance] = useState("0.00");

  // Sử dụng Ref để lưu trữ giá trị trước đó chính xác mà không gây render loop
  const prevBalanceRef = useRef(null);

  const navLinks = [
    { path: '/', label: 'Trang chủ', icon: <Home size={14} /> },
    { path: '/explore', label: 'Đấu giá', icon: <LayoutGrid size={14} /> },
    { path: '/create', label: 'Đăng bán', icon: <Upload size={14} /> },
    { path: '/profile', label: 'Cá nhân', icon: <User size={14} /> },
  ];

  // 1. LOGIC BIẾN ĐỘNG SỐ DƯ (Nâng cấp)
  const checkBalanceChange = useCallback(async () => {
    if (!account?.address) return;
    try {
      const coinBalance = await client.getBalance({
        owner: account.address,
        coinType: '0x2::sui::SUI',
      });

      const currentBalanceRaw = Number(coinBalance.totalBalance) / 1e9;

      // Nếu đây không phải lần đầu load và có sự thay đổi đáng kể (> 0.00001)
      if (prevBalanceRef.current !== null) {
        const diff = currentBalanceRaw - prevBalanceRef.current;

        if (Math.abs(diff) > 0.00001) {
          const isIncrease = diff > 0;
          const newNotif = {
            id: `bal-${Date.now()}`,
            amount: Math.abs(diff).toFixed(4),
            isUp: isIncrease,
            type: 'WALLET',
            title: isIncrease ? "VÍ ĐÃ NHẬN TIỀN" : "VÍ ĐÃ CHI TIỀN",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isNew: true
          };
          setNotifications(prev => [newNotif, ...prev].slice(0, 15));
        }
      }

      // Cập nhật giá trị hiển thị và giá trị Ref
      setBalance(currentBalanceRaw.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      prevBalanceRef.current = currentBalanceRaw;
    } catch (err) {
      console.error("Lỗi cập nhật số dư:", err);
    }
  }, [client, account?.address]);

  // 2. LOGIC ĐẤU GIÁ (Vượt thầu)
  const fetchAuctionEvents = useCallback(async () => {
    if (!account?.address) return;
    try {
      const events = await client.queryEvents({
        query: { MoveEventType: `${PACKAGE_ID}::charity_auction::BidPlaced` },
        limit: 5,
        order: 'descending',
      });

      if (events.data?.length > 0) {
        const myAddress = account.address;
        const latestEvent = events.data[0];

        if (latestEvent.id.txDigest !== lastEventId) {
          const bidData = latestEvent.parsedJson;
          const isMyBid = bidData.bidder === myAddress;
          const isMyPrevBid = bidData.previous_bidder === myAddress;

          if (isMyBid || isMyPrevBid) {
            const auctionNotif = {
              id: latestEvent.id.txDigest,
              amount: (Number(bidData.bid_amount || 0) / 1e9).toFixed(2),
              isUp: isMyBid,
              type: 'AUCTION',
              title: isMyBid ? "ĐẶT THẦU THÀNH CÔNG" : "BẠN ĐÃ BỊ VƯỢT THẦU",
              time: new Date(Number(latestEvent.timestampMs)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isNew: true
            };
            setNotifications(prev => [auctionNotif, ...prev.filter(n => n.id !== auctionNotif.id)].slice(0, 15));
          }
          setLastEventId(latestEvent.id.txDigest);
        }
      }
    } catch (err) {
      console.error("Lỗi sự kiện:", err);
    }
  }, [client, account?.address, lastEventId]);

  useEffect(() => {
    if (account?.address) {
      checkBalanceChange();
      fetchAuctionEvents();
      const timer = setInterval(() => {
        checkBalanceChange();
        fetchAuctionEvents();
      }, 5000); // Rút ngắn xuống 5s để thông báo mượt hơn
      return () => clearInterval(timer);
    } else {
      setNotifications([]);
      setBalance("0.00");
      prevBalanceRef.current = null;
    }
  }, [account?.address, checkBalanceChange, fetchAuctionEvents]);

  return (
    <nav className={`fixed top-0 w-full z-[9999] transition-all duration-500 ${scrolled ? 'bg-[#050B18]/95 backdrop-blur-2xl border-b border-white/5 py-3' : 'bg-transparent py-6'
      }`}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex justify-between items-center">

        {/* LOGO */}
        <Link to="/" className="flex flex-col group z-10">
          <span className="text-xl md:text-2xl font-black italic tracking-tighter text-white">
            SUI<span className="text-sui-cyan drop-shadow-[0_0_10px_#00D1FF]">CHARITY</span>
          </span>
          <span className="text-[7px] font-black text-white/30 tracking-[0.4em] uppercase">Impact Protocol</span>
        </Link>

        {/* DESKTOP NAV */}
        <div className="hidden lg:flex gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} className={`relative px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${location.pathname === link.path ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}>
              {location.pathname === link.path && (
                <motion.div layoutId="nav-bg" className="absolute inset-0 bg-sui-cyan/20 border border-sui-cyan/50 rounded-xl" />
              )}
              <span className="relative z-10 flex items-center gap-2">{link.icon} {link.label}</span>
            </Link>
          ))}
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-3">
          {account && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-sui-cyan/5 rounded-xl border border-sui-cyan/20">
                <Wallet size={12} className="text-sui-cyan" />
                <span className="text-[11px] font-black text-white">{balance} SUI</span>
              </div>

              <div className="relative">
                <button
                  onClick={() => { setShowNotifs(!showNotifs); setNotifications(prev => prev.map(n => ({ ...n, isNew: false }))); }}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:border-sui-cyan/50 transition-all relative"
                >
                  <Bell size={18} />
                  {notifications.some(n => n.isNew) && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-sui-cyan rounded-full animate-pulse shadow-[0_0_8px_#00D1FF]" />
                  )}
                </button>

                <AnimatePresence>
                  {showNotifs && (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }}
                      className="absolute right-0 mt-4 w-80 bg-[#0A1120] border border-white/10 rounded-3xl p-5 shadow-2xl z-[100]">
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                        <span className="text-[10px] font-black uppercase text-white/40 tracking-tighter">Hoạt động tài khoản</span>
                        <Activity size={12} className="text-sui-cyan" />
                      </div>
                      <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? notifications.map(notif => (
                          <div key={notif.id} className={`p-3 rounded-2xl border flex gap-3 items-center ${notif.isUp ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                            <div className={`p-2 rounded-lg ${notif.isUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-500'}`}>
                              {notif.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <p className={`text-[9px] font-black ${notif.isUp ? 'text-green-400' : 'text-red-400'}`}>{notif.title}</p>
                                <span className="text-[7px] text-white/20 font-mono">{notif.time}</span>
                              </div>
                              <p className="text-white font-black text-sm">{notif.isUp ? '+' : '-'}{notif.amount} SUI</p>
                            </div>
                          </div>
                        )) : <div className="py-10 text-center text-[10px] text-white/20 font-black uppercase tracking-widest">Không có dữ liệu mới</div>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          <div className="scale-90 md:scale-100"><ConnectButton /></div>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 text-white">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#050B18] border-t border-white/10 overflow-hidden">
            <div className="p-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-4 p-4 rounded-2xl text-xs font-black uppercase tracking-widest ${location.pathname === link.path ? 'bg-sui-cyan/10 text-sui-cyan' : 'text-white/60'
                    }`}>
                  {link.icon} {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}