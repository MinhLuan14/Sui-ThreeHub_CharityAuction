import React, { useEffect, useState } from 'react';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Loader2, Search, Activity, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const PACKAGE_ID = "0x01917a9923bd2a7e3cc11fb493a98cf2291703efd1879e5c4b6cf08125fdad08";

const IPFS_GATEWAYS = [
    "https://nftstorage.link/ipfs/",
    "https://gateway.pinata.cloud/ipfs/",
    "https://ipfs.io/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/"
];

export default function Explore() {
    const client = useSuiClient();
    const account = useCurrentAccount();
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getCleanCID = (raw) => {
        if (!raw) return "";
        let cid = raw.split('ipfs/').pop().replace('ipfs://', '').trim();
        if (cid.endsWith('/')) cid = cid.slice(0, -1);
        return cid;
    };

    useEffect(() => {
        async function autoDiscoverAuctions() {
            try {
                setLoading(true);
                const events = await client.queryEvents({
                    query: { MoveEventType: `${PACKAGE_ID}::charity_auction::AuctionCreated` }
                });

                const allIds = events.data.map(event => event.parsedJson.auction_id);
                if (allIds.length === 0) {
                    setAuctions([]);
                    return;
                }

                const response = await client.multiGetObjects({
                    ids: allIds,
                    options: { showContent: true, showOwner: true }
                });

                const mappedData = response.map(obj => {
                    const fields = obj.data?.content?.fields;
                    if (!fields) return null;
                    const nftFields = fields.nft?.fields;

                    return {
                        id: obj.data.objectId,
                        creator: fields.creator,
                        name: (nftFields?.name || "NFT").split(' | ')[0],
                        cid: getCleanCID(nftFields?.metadata || ""),
                        price: (Number(fields.highest_bid || 0) / 1000000000).toFixed(2),
                        status: fields.status
                    };
                }).filter(item => item !== null && item.status === true);

                setAuctions(mappedData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        autoDiscoverAuctions();
    }, [client]);

    const handleImageError = (e, cid) => {
        const currentSrc = e.target.src;
        let nextIndex = 0;
        for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
            if (currentSrc.includes(IPFS_GATEWAYS[i])) {
                nextIndex = i + 1;
                break;
            }
        }
        if (nextIndex < IPFS_GATEWAYS.length) {
            e.target.src = `${IPFS_GATEWAYS[nextIndex]}${cid}`;
        } else {
            e.target.src = "https://placehold.co/400x400/0a1120/ffffff?text=Image+Error";
            e.target.onerror = null;
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#050B18]">
            <div className="relative">
                <div className="absolute -inset-4 bg-sui-cyan/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="animate-spin text-sui-cyan relative z-10" size={48} />
            </div>
        </div>
    );

    return (
        <div className="pt-32 pb-20 max-w-7xl mx-auto px-10 text-white min-h-screen bg-[#050B18]">
            {/* TIÊU ĐỀ SECTION */}
            <div className="mb-16 relative">
                <h1 className="text-6xl font-black italic uppercase tracking-tighter">
                    Khám phá <span className="text-sui-cyan drop-shadow-[0_0_15px_rgba(0,209,255,0.5)]">Đấu giá</span>
                </h1>
                <div className="flex items-center gap-3 mt-3">
                    <span className="flex items-center gap-1.5 text-sui-cyan text-[10px] font-black uppercase tracking-[0.3em]">
                        <Activity size={12} className="animate-pulse" /> Live on Sui
                    </span>
                    <div className="h-px w-20 bg-white/10" />
                    <p className="text-white/30 font-bold uppercase text-[9px] tracking-[0.2em]">Real-time Impact Protocol</p>
                </div>
            </div>

            {auctions.length === 0 ? (
                <div className="text-center py-32 bg-white/5 border border-white/5 rounded-5xl backdrop-blur-3xl">
                    <Search className="mx-auto text-white/10 mb-6" size={64} />
                    <p className="text-white/40 font-black uppercase italic tracking-[0.2em] text-xl">
                        Không có phiên đấu giá nào
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {auctions.map((item) => {
                        const isMyProduct = account?.address === item.creator;

                        return (
                            <div key={item.id} className="glass-card p-5 rounded-5xl border border-white/5 hover:border-sui-cyan/40 transition-all duration-500 group relative overflow-hidden bg-[#0A1120]">
                                {/* ẢNH NFT */}
                                <div className="relative aspect-square rounded-4xl overflow-hidden mb-6 bg-slate-900 border border-white/5">
                                    {isMyProduct && (
                                        <div className="absolute top-4 right-4 z-20 bg-sui-cyan text-sui-dark text-[9px] font-black uppercase px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl border border-sui-dark/20">
                                            <User size={10} fill="currentColor" />
                                            Của bạn
                                        </div>
                                    )}

                                    <img
                                        src={`${IPFS_GATEWAYS[0]}${item.cid}`}
                                        alt={item.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        onError={(e) => handleImageError(e, item.cid)}
                                    />

                                    <div className="absolute bottom-4 left-4 bg-sui-dark/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[8px] font-black text-sui-cyan uppercase tracking-widest italic flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Activity size={10} className="animate-pulse" />
                                        Bidding Live
                                    </div>
                                </div>

                                {/* THÔNG TIN */}
                                <div className="px-2">
                                    <h3 className="text-xl font-black italic text-white uppercase mb-1 truncate leading-tight group-hover:text-sui-cyan transition-colors">
                                        {item.name}
                                    </h3>
                                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-5">
                                        Sui Charity Art
                                    </p>

                                    <div className="flex justify-between items-center bg-white/5 rounded-3xl p-4 border border-white/5 group-hover:bg-sui-cyan/10 transition-all">
                                        <div>
                                            <p className="text-[8px] text-white/40 font-black uppercase tracking-widest mb-1">Giá hiện tại</p>
                                            <p className="text-xl font-black text-sui-cyan italic tracking-tighter leading-none">
                                                {item.price} <span className="text-[10px] text-white/40">SUI</span>
                                            </p>
                                        </div>

                                        <Link
                                            to={`/item/${item.id}`}
                                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg ${isMyProduct
                                                ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                                                : 'bg-sui-cyan text-sui-dark hover:scale-105 active:scale-95 shadow-sui-cyan/20'
                                                }`}
                                        >
                                            {isMyProduct ? 'Của bạn' : 'Đấu giá'}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}