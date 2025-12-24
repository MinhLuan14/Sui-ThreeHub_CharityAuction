import React, { useEffect, useState, useMemo } from 'react';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Loader2, Search, Activity, User, LayoutGrid, Sparkles, Gavel } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const PACKAGE_ID = "0x5e4414f266147c07b0b15ded6239606c78333628b4fe251b1dbaa7600c637675";

const getIPFSUrl = (url) => {
    if (!url || typeof url !== 'string') return "https://placehold.jp/24/0a1120/ffffff/400x400.png?text=No+Image";
    const parts = url.split('/');
    const cid = parts[parts.length - 1].trim();
    return cid ? `https://gateway.pinata.cloud/ipfs/${cid}` : "https://placehold.jp/24/0a1120/ffffff/400x400.png?text=Invalid+CID";
};

const extractNFTData = (obj) => {
    const fields = obj.data?.content?.fields;
    if (!fields) return null;
    const nft = fields.nft?.fields?.contents?.fields || fields.nft?.fields || fields.nft;
    const rawImage = nft?.image_url || nft?.url || nft?.metadata || obj.data?.display?.data?.image_url;

    return {
        id: obj.data.objectId,
        name: (nft?.name || "Unnamed").split('|')[0].trim(),
        currentBid: (Number(fields.highest_bid || 0) / 1e9).toFixed(2),
        image: getIPFSUrl(rawImage),
        status: fields.status === true ? "LIVE" : "ENDED",
        seller: fields.seller || fields.creator,
        highest_bidder: fields.highest_bidder
    };
};

export default function Explore() {
    const client = useSuiClient();
    const currentAccount = useCurrentAccount();
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchAllAuctions() {
            try {
                setLoading(true);
                const events = await client.queryEvents({
                    query: { MoveEventType: `${PACKAGE_ID}::charity_auction::AuctionCreated` }
                });
                const allAuctionIds = [...new Set(events.data.map((e) => e.parsedJson.auction_id))];
                if (allAuctionIds.length === 0) { setAuctions([]); return; }

                const response = await client.multiGetObjects({
                    ids: allAuctionIds,
                    options: { showContent: true, showDisplay: true }
                });

                const mappedData = response
                    .map(obj => extractNFTData(obj))
                    .filter(item => item !== null && item.status === "LIVE");

                setAuctions(mappedData);
            } catch (err) {
                console.error("Explore Sync Error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAllAuctions();
    }, [client]);

    const filteredAuctions = useMemo(() => {
        let result = [...auctions];
        if (filter === 'mine' && currentAccount?.address) {
            result = result.filter(item => item.seller === currentAccount.address);
        }
        if (searchQuery.trim() !== "") {
            const term = searchQuery.toLowerCase().trim();
            result = result.filter(item => item.name.toLowerCase().includes(term));
        }
        return result;
    }, [auctions, filter, currentAccount?.address, searchQuery]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#050B18]">
            <Loader2 className="animate-spin text-sui-cyan" size={40} />
        </div>
    );

    return (
        /* 1. BACKGROUND TOÀN TRANG: Đã chỉnh pt-24 (khoảng 100px) và pb-28 (khoảng 120px) */
        <div className="pt-24 pb-28 min-h-screen  text-white relative overflow-hidden">

            {/* Hiệu ứng ánh sáng trang trí phía sau (Hạt sáng mờ) */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-sui-cyan/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-[-5%] w-[400px] h-[400px] bg-sui-cyan/5 blur-[100px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                    <div>
                        <h1 className="text-6xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
                            Explore <span className="text-sui-cyan drop-shadow-[0_0_15px_rgba(0,247,255,0.4)]">Market</span>
                        </h1>
                        <div className="flex items-center gap-3 mt-4 text-white/30 font-bold uppercase text-[10px] tracking-[0.3em]">
                            <Activity size={14} className="text-sui-cyan animate-pulse" /> Live Auctions
                        </div>
                    </div>

                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-sui-cyan transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="TÌM KIẾM..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-sui-cyan/50 focus:bg-white/10 font-black text-[10px] tracking-widest uppercase transition-all backdrop-blur-md"
                        />
                    </div>
                </div>

                {/* FILTERS */}
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 w-fit mb-16 backdrop-blur-md">
                    <button
                        onClick={() => setFilter('all')}
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-sui-cyan text-black shadow-lg shadow-sui-cyan/40' : 'text-white/40 hover:text-white'}`}
                    >
                        <LayoutGrid size={14} /> Tất cả
                    </button>
                    <button
                        onClick={() => setFilter('mine')}
                        disabled={!currentAccount}
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'mine' ? 'bg-sui-cyan text-black shadow-lg shadow-sui-cyan/40' : 'text-white/40 hover:text-white disabled:opacity-20'}`}
                    >
                        <User size={14} /> Của tôi
                    </button>
                </div>

                {/* GRID SẢN PHẨM */}
                {filteredAuctions.length === 0 ? (
                    <div className="text-center py-40 bg-white/2 border border-white/5 rounded-[60px]">
                        <Search className="mx-auto text-white/5 mb-6" size={60} />
                        <p className="text-white/20 font-black uppercase tracking-widest">Không có sản phẩm</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        <AnimatePresence mode='popLayout'>
                            {filteredAuctions.map((item) => {
                                const isMine = currentAccount?.address && item.seller === currentAccount.address;

                                return (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        key={item.id}
                                        /* BACKGROUND THẺ CARD: Trong suốt hơn để không bị nặng nề */
                                        className="group bg-[#0A1120]/80 border border-white/5 rounded-[50px] p-7 transition-all duration-500 relative hover:border-sui-cyan/60 hover:shadow-[0_0_50px_rgba(0,247,255,0.2)] hover:-translate-y-2 backdrop-blur-sm"
                                    >
                                        {/* THUMBNAIL CAO (aspect-[4/5]) */}
                                        <div className="relative aspect-[4/5] rounded-[40px] overflow-hidden mb-8 bg-black shadow-2xl border border-white/5">
                                            {isMine && (
                                                <div className="absolute top-5 left-5 z-20 bg-sui-cyan text-black text-[8px] font-black uppercase px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl">
                                                    <Sparkles size={12} /> Của bạn
                                                </div>
                                            )}
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                                                onError={(e) => { e.target.src = "https://placehold.jp/24/0a1120/ffffff/600x600.png?text=Error"; }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-sui-cyan/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        </div>

                                        <div className="px-2">
                                            <h3 className="text-2xl font-black italic text-white uppercase truncate mb-8 group-hover:text-sui-cyan transition-colors duration-300">
                                                {item.name}
                                            </h3>

                                            {/* PHẦN GIÁ & NÚT: Đã dọn dẹp background bên dưới hoàn toàn sạch sẽ */}
                                            <div className="flex items-center justify-between bg-transparent">
                                                <div>
                                                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Highest Bid</p>
                                                    <div className="flex items-baseline gap-1">
                                                        <p className="text-3xl font-black italic text-sui-cyan tracking-tighter drop-shadow-[0_0_10px_rgba(0,247,255,0.4)]">
                                                            {item.currentBid}
                                                        </p>
                                                        <span className="text-[10px] font-bold text-white/40">SUI</span>
                                                    </div>
                                                </div>

                                                <Link
                                                    to={`/item/${item.id}`}
                                                    className="h-14 px-8 bg-sui-cyan rounded-full flex items-center justify-center gap-2 text-[#050B18] text-[12px] font-black uppercase italic tracking-tighter transition-all duration-300 hover:bg-white hover:shadow-[0_0_30px_rgba(0,247,255,0.6)] active:scale-95 group/btn"
                                                >
                                                    Đấu giá
                                                    <Gavel size={16} strokeWidth={3} className="group-hover/btn:rotate-12 transition-transform" />
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}