import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton, useCurrentAccount, useConnectWallet, useWallets } from '@mysten/dapp-kit';
import { LayoutGrid, User, Upload, ChevronDown, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Header({ scrolled }) {
  const account = useCurrentAccount();
  const location = useLocation();
  const wallets = useWallets();
  const { mutate: connect } = useConnectWallet();

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleConnectSlush = () => {
    const slushWallet = wallets.find(
      (wallet) => wallet.name.toLowerCase().includes('slush')
    );

    if (slushWallet) {
      connect({ wallet: slushWallet });
    } else {
      alert("Vui lòng cài đặt Slush Wallet!");
      window.open("https://slush.pet/", "_blank");
    }
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-sui-dark/90 backdrop-blur-2xl border-b border-white/5 py-3' : 'bg-transparent py-6'
      }`}>
      <div className="max-w-7xl mx-auto px-10 flex justify-between items-center">

        {/* LOGO */}
        <Link to="/" className="flex flex-col group">
          <span className="text-2xl font-black italic tracking-tighter text-white">
            SUI<span className="text-sui-cyan drop-shadow-[0_0_10px_#00D1FF]">CHARITY</span>
          </span>
          <span className="text-[7px] font-black text-white/30 tracking-[0.4em] uppercase leading-none">
            Impact Protocol
          </span>
        </Link>

        {/* NAVIGATION LINKS - ĐÃ ĐIỀN LẠI ĐẦY ĐỦ */}
        <div className="hidden md:flex gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
          {[
            { path: '/', label: 'Trang chủ', icon: null },
            { path: '/explore', label: 'Đấu giá', icon: <LayoutGrid size={14} /> },
            { path: '/create', label: 'Đăng bán', icon: <Upload size={14} /> },
            { path: '/profile', label: 'Cá nhân', icon: <User size={14} /> },
          ].map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${location.pathname === link.path ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
            >
              {location.pathname === link.path && (
                <motion.div layoutId="nav-bg" className="absolute inset-0 bg-sui-cyan/20 border border-sui-cyan/50 rounded-xl" />
              )}
              <span className="relative z-10 flex items-center gap-2">{link.icon} {link.label}</span>
            </Link>
          ))}
        </div>

        {/* WALLET SECTION */}
        <div className="flex items-center gap-6">
          {account ? (
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex flex-col items-end border-r border-white/10 pr-4">
                <span className="text-[9px] font-black text-sui-cyan uppercase tracking-widest flex items-center gap-1.5">
                  <Activity size={10} className="animate-pulse" /> Live on Sui
                </span>
                <span className="text-[10px] font-mono text-white/40 font-bold tracking-tight">
                  {formatAddress(account.address)}
                </span>
              </div>

              <div className="relative group isolate">
                <div className="absolute bg-linear-to-r from-sui-cyan via-blue-600 to-purple-600 rounded-xl blur-[2px] opacity-70 animate-border-flow pointer-events-none z-0" />
                <div className="relative z-10">
                  <ConnectButton />
                </div>
              </div>
            </div>
          ) : (
            <div className="relative group isolate">
              <div className="absolute -inset-1 bg-sui-cyan rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none z-0" />
              <button
                onClick={handleConnectSlush}
                className="relative z-10 bg-sui-dark px-8 py-2.5 rounded-xl border border-white/10 text-[11px] font-black uppercase tracking-tighter text-white hover:border-sui-cyan/50 transition-all cursor-pointer"
              >
                Connect Slush
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}