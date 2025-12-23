import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, ShieldCheck, ArrowRight, Heart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
    const stats = [
        { label: "Tổng quyên góp", value: "128,450", unit: "SUI", icon: <TrendingUp />, color: "from-cyan-500 to-blue-600" },
        { label: "Trẻ em được giúp", value: "3,200", unit: "+", icon: <Users />, color: "from-purple-500 to-pink-500" },
        { label: "Giao dịch an toàn", value: "100", unit: "%", icon: <ShieldCheck />, color: "from-emerald-500 to-teal-400" }
    ];

    return (
        <div className="w-full flex flex-col items-center">
            {/* HERO SECTION */}
            <section className="pt-32 pb-20 text-center px-6 relative max-w-7xl">
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] mb-10 backdrop-blur-md">
                        <Sparkles size={14} className="animate-pulse" />
                        Live on Sui Network
                    </div>

                    <h1 className="text-7xl md:text-[9.5rem] font-black italic tracking-tighter leading-[0.85] mb-8 uppercase text-white">
                        Giving is <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-600 drop-shadow-[0_0_50px_rgba(6,182,212,0.5)]">
                            Living
                        </span>
                    </h1>

                    <p className="text-white/40 max-w-2xl mx-auto text-lg md:text-xl font-medium mb-12 tracking-tight">
                        Nền tảng đấu giá NFT thiện nguyện <span className="text-white">minh bạch</span> trên Sui. <br />
                        Mọi đóng góp được lưu trữ vĩnh viễn và gửi trực tiếp đến những hoàn cảnh cần giúp đỡ.
                    </p>

                    <div className="flex flex-col md:flex-row justify-center gap-6">
                        <Link to="/explore" className="px-12 py-5 bg-cyan-600 rounded-2xl font-black uppercase italic hover:bg-cyan-500 transition-all shadow-[0_20px_40px_rgba(6,182,212,0.3)] flex items-center gap-3 active:scale-95 text-white">
                            Bắt đầu ngay <ArrowRight size={20} />
                        </Link>
                        <Link to="/create" className="px-12 py-5 bg-white/5 border border-white/10 rounded-2xl font-black uppercase italic hover:bg-white/10 transition-all backdrop-blur-md text-white">
                            Tạo chiến dịch
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* STATS SECTION */}
            <section className="w-full max-w-6xl px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: 50, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card neon-border p-12 rounded-[40px] text-center group relative overflow-hidden transition-all duration-500"
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />

                        <div className={`mx-auto w-16 h-16 mb-8 flex justify-center items-center rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform`}>
                            <div className="text-white scale-150">{stat.icon}</div>
                        </div>

                        <h2 className="text-5xl font-black text-white mb-2 tracking-tighter">
                            {stat.value}<span className="text-cyan-500">{stat.unit}</span>
                        </h2>
                        <p className="text-white/30 font-bold uppercase text-[10px] tracking-[0.4em]">{stat.label}</p>
                    </motion.div>
                ))}
            </section>
        </div>
    );
}