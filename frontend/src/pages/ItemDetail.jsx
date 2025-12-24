import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSuiClient, useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
// GIẢI PHÁP: Đổi tên Transaction thành SuiTransaction để tránh lỗi "Illegal constructor"
import { Transaction as SuiTransaction } from '@mysten/sui/transactions';
import { motion, AnimatePresence } from 'framer-motion';
// Bổ sung History vào lucide-react
import { Clock, Loader2, Wallet, ChevronRight, Trophy, Tag, Activity, Sparkles, ImageOff, History } from 'lucide-react';
import toast from 'react-hot-toast';

const PACKAGE_ID = "0x5e4414f266147c07b0b15ded6239606c78333628b4fe251b1dbaa7600c637675";

const IPFS_GATEWAYS = [
    "https://ipfs.io/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://gateway.pinata.cloud/ipfs/",
    "https://nftstorage.link/ipfs/"
];

export default function ItemDetails() {
    const { id } = useParams();
    const client = useSuiClient();
    const currentAccount = useCurrentAccount();
    const { mutate: signAndExecute, isPending: isTxPending } = useSignAndExecuteTransaction();

    const [auction, setAuction] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bidAmount, setBidAmount] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);

    const [imageIndex, setImageIndex] = useState(0);
    const [imageError, setImageError] = useState(false);
    const lastHighestBidRef = useRef(0);

    // FIX: Tự động reset và load lại dữ liệu khi người dùng đổi ví
    useEffect(() => {
        if (currentAccount?.address) {
            setBidAmount('');
            fetchAllData(true);
        }
    }, [currentAccount?.address]);

    const getIpfsUrls = (url) => {
        if (!url || typeof url !== 'string') return [];
        if (url.startsWith('http') && !url.includes('ipfs')) return [url];
        const cid = url.replace("ipfs://", "").split("ipfs/").pop().trim();
        return IPFS_GATEWAYS.map(gw => `${gw}${cid}`);
    };

    const deepExtractNFT = (nftField) => {
        if (!nftField) return null;
        const data = nftField.fields?.contents?.fields || nftField.fields || nftField.contents?.fields || nftField;
        return data;
    };

    const fetchAllData = useCallback(async (isManualUpdate = false, digest = null) => {
        try {
            if (digest) {
                await client.waitForTransaction({ digest });
                await new Promise(res => setTimeout(res, 1500));
            }

            const res = await client.getObject({
                id,
                options: { showContent: true, showDisplay: true }
            });

            const fields = res.data?.content?.fields;
            if (!fields) return;

            const newHighestBid = Number(fields.highest_bid) / 1e9;
            if (newHighestBid > lastHighestBidRef.current) {
                if (lastHighestBidRef.current !== 0 && !isManualUpdate) {
                    toast.success(`Giá thầu mới: ${newHighestBid} SUI`, { id: 'price-update', icon: '🔥' });
                }
                lastHighestBidRef.current = newHighestBid;
            }

            const display = res.data?.display?.data;
            const nftData = deepExtractNFT(fields.nft);

            const rawName = display?.name || nftData?.name || "Vật phẩm đấu giá";
            const rawImage = display?.image_url || nftData?.image_url || nftData?.metadata || nftData?.url;

            let finalName = rawName;
            let finalDesc = display?.description || nftData?.description || "Không có miêu tả chi tiết.";

            if (rawName.includes('|')) {
                const parts = rawName.split('|');
                finalName = parts[0].trim();
                finalDesc = parts[1].trim();
            }

            setAuction({
                id,
                name: finalName,
                description: finalDesc,
                images: getIpfsUrls(rawImage),
                highestBid: newHighestBid,
                endTime: Number(fields.end_time),
                status: fields.status,
                seller: fields.seller,
                highestBidder: fields.highest_bidder?.fields?.contents || fields.highest_bidder
            });

            const events = await client.queryEvents({
                query: { MoveEventType: `${PACKAGE_ID}::charity_auction::BidPlaced` },
                order: "descending",
                limit: 30
            });

            const filteredHistory = events.data
                .filter(e => {
                    const eventAuctionId = e.parsedJson.auction_id?.id || e.parsedJson.auction_id;
                    return String(eventAuctionId) === String(id);
                })
                .map(e => ({
                    bidder: e.parsedJson.bidder,
                    amount: Number(e.parsedJson.bid_amount) / 1e9,
                    time: new Date(Number(e.timestampMs)).toLocaleTimeString()
                }));

            setHistory(filteredHistory);
            setTimeLeft(Math.max(0, Math.floor((Number(fields.end_time) - Date.now()) / 1000)));

        } catch (err) {
            console.error("Lỗi đồng bộ:", err);
        } finally {
            setLoading(false);
        }
    }, [id, client]);

    useEffect(() => {
        fetchAllData();
        const interval = setInterval(() => fetchAllData(), 5000);
        return () => clearInterval(interval);
    }, [fetchAllData]);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleBid = async () => {
        if (!currentAccount) return toast.error("Vui lòng kết nối ví!");

        const bidValue = Number(bidAmount);
        const currentHighest = auction?.highestBid || 0;

        if (!bidAmount || bidValue <= currentHighest) {
            return toast.error(`Giá thầu phải cao hơn giá hiện tại (${currentHighest} SUI)!`);
        }

        try {
            // SỬA: Dùng SuiTransaction thay vì Transaction
            const txb = new SuiTransaction();
            const amountMist = BigInt(Math.round(bidValue * 1e9));

            const [coin] = txb.splitCoins(txb.gas, [txb.pure.u64(amountMist)]);

            txb.moveCall({
                target: `${PACKAGE_ID}::charity_auction::place_bid`,
                arguments: [
                    txb.object(id),
                    coin,
                    txb.object('0x6'),
                ],
            });

            txb.setGasBudget(50000000);

            signAndExecute({ transaction: txb }, {
                onSuccess: (result) => {
                    toast.success("Giao dịch đặt thầu thành công!");
                    setBidAmount('');
                    setTimeout(() => fetchAllData(true, result.digest), 2000);
                },
                onError: (err) => toast.error("Giao dịch thất bại: " + err.message)
            });
        } catch (err) {
            toast.error("Lỗi khởi tạo giao dịch.");
        }
    };

    const handleEndAuction = async () => {
        if (!currentAccount) return toast.error("Vui lòng kết nối ví!");

        try {
            const txb = new SuiTransaction();

            txb.moveCall({
                // 1. Sửa đúng tên hàm là 'end_auction'
                target: `${PACKAGE_ID}::charity_auction::end_auction`,
                arguments: [
                    txb.object(id),        // Tham số 1: Auction Object ID
                    txb.object('0x6'),     // Tham số 2: SUI Clock Object ID
                ],
            });

            // Thiết lập gas budget an toàn
            txb.setGasBudget(100000000); // 0.1 SUI

            signAndExecute({ transaction: txb }, {
                onSuccess: (result) => {
                    toast.success("Xử lý kết thúc đấu giá thành công!", { icon: '🏆' });
                    // Đợi blockchain cập nhật dữ liệu mới
                    setTimeout(() => fetchAllData(true, result.digest), 2000);
                },
                onError: (err) => {
                    console.error("Lỗi End Auction:", err);
                    if (err.message.includes("EAuctionNotEnded")) {
                        toast.error("Chưa đến thời gian kết thúc đấu giá!");
                    } else {
                        toast.error("Lỗi: " + err.message);
                    }
                }
            });
        } catch (e) {
            console.error(e);
            toast.error("Lỗi khởi tạo giao dịch.");
        }
    };

    const handleClaim = async () => {
        try {
            // SỬA: Dùng SuiTransaction
            const txb = new SuiTransaction();
            txb.moveCall({
                target: `${PACKAGE_ID}::charity_auction::complete_auction`,
                arguments: [txb.object(id)],
            });

            signAndExecute({ transaction: txb }, {
                onSuccess: () => {
                    toast.success("NFT đã được chuyển về ví của bạn.");
                    fetchAllData();
                },
                onError: (err) => toast.error("Lỗi: " + err.message)
            });
        } catch (err) {
            toast.error("Lỗi khi nhận vật phẩm.");
        }
    };

    const formatTime = (s) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050810] flex items-center justify-center">
            <Loader2 className="animate-spin text-cyan-400" size={50} />
        </div>
    );

    return (
        <div className="min-h-screen  text-white pt-32 pb-20 px-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* TRÁI: Media & Chi tiết */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="relative rounded-[40px] overflow-hidden bg-[#0A1120] border border-white/10 aspect-square flex items-center justify-center">
                        {!imageError && auction?.images?.length > 0 ? (
                            <img
                                src={auction.images[imageIndex]}
                                className="w-full h-full object-cover"
                                onError={() => (imageIndex < auction.images.length - 1) ? setImageIndex(i => i + 1) : setImageError(true)}
                                alt="Auction Item"
                            />
                        ) : (
                            <div className="text-slate-700 flex flex-col items-center gap-4">
                                <ImageOff size={60} />
                                <span className="text-[10px] font-black tracking-widest uppercase">No Preview</span>
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-white/5 rounded-[35px] border border-white/5 backdrop-blur-md">
                        <p className="text-cyan-400 text-[10px] font-black tracking-[0.3em] mb-4 uppercase flex items-center gap-2">
                            <Tag size={14} /> Chi tiết vật phẩm
                        </p>
                        <p className="text-slate-300 leading-relaxed italic text-lg">{auction?.description}</p>
                    </div>
                </div>

                {/* PHẢI: Bidding & Action */}
                <div className="lg:col-span-7 space-y-8">
                    <h1 className="text-4xl md:text-6xl font-black italic uppercase text-white leading-tight">
                        {auction?.name}
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 rounded-[35px] bg-white/5 border border-white/5">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Thời gian còn lại</span>
                            <div className="text-4xl font-mono font-bold mt-2">
                                {timeLeft > 0 ? formatTime(timeLeft) : "00:00:00"}
                            </div>
                        </div>

                        <div className="p-8 rounded-[35px] bg-cyan-500/10 border border-cyan-500/20">
                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Giá hiện tại</span>
                            <div className="text-4xl font-black italic text-cyan-400 mt-2">
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={auction?.highestBid}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {auction?.highestBid}
                                    </motion.span>
                                </AnimatePresence>
                                <span className="text-lg not-italic text-white/40 ml-2">SUI</span>
                            </div>
                        </div>
                    </div>

                    {/* KHU VỰC TƯƠNG TÁC CHÍNH */}
                    <div className="p-10 rounded-[45px] bg-[#0A1120] border border-white/10 shadow-2xl relative overflow-hidden">
                        {timeLeft > 0 && auction?.status ? (
                            /* CASE 1: ĐANG TRONG PHIÊN ĐẤU GIÁ */
                            <div className="space-y-6">
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        placeholder={`Nhập mức giá > ${auction?.highestBid} SUI`}
                                        className="w-full bg-black/50 border-2 border-white/5 rounded-[30px] p-8 text-3xl font-black text-cyan-400 outline-none focus:border-cyan-500 transition-all"
                                    />
                                    <Wallet className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-700" size={30} />
                                </div>
                                <button
                                    onClick={handleBid}
                                    disabled={isTxPending}
                                    className="w-full py-8 bg-cyan-500 hover:bg-white text-black rounded-[30px] font-black text-2xl italic uppercase transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-cyan-500/20"
                                >
                                    {isTxPending ? <Loader2 className="animate-spin" /> : "Đặt giá ngay"}
                                </button>
                            </div>
                        ) : (
                            /* CASE 2: PHIÊN ĐÃ KẾT THÚC */
                            <div className="text-center py-6 space-y-8">
                                <div className="relative inline-block">
                                    <Trophy className="mx-auto text-yellow-500 animate-bounce" size={80} />
                                    <Sparkles className="absolute -top-2 -right-2 text-cyan-400 animate-pulse" />
                                </div>

                                <div>
                                    <h2 className="text-4xl font-black uppercase italic">Phiên đã kết thúc</h2>
                                    {auction?.highestBidder ? (
                                        <div className="mt-4 p-6 bg-white/5 rounded-[30px] border border-white/10">
                                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Người thắng cuộc</p>
                                            <p className="font-mono text-cyan-400 font-bold break-all text-sm">
                                                {auction.highestBidder}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-red-400 mt-2 italic font-medium text-lg">Không có lượt thầu nào cho vật phẩm này.</p>
                                    )}
                                </div>

                                {/* NHÓM NÚT ĐIỀU KHIỂN SAU KẾT THÚC */}
                                <div className="grid grid-cols-1 gap-4 pt-4">

                                    {/* 1. Dành cho NGƯỜI THẮNG: Nhận NFT */}
                                    {currentAccount?.address === auction?.highestBidder && auction?.highestBidder && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleEndAuction} // Dùng chung hàm này
                                            className="w-full py-7 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-[30px] font-black text-2xl uppercase italic shadow-xl"
                                        >
                                            {currentAccount?.address === auction?.highestBidder ? "Nhận NFT về ví" : "Xác nhận kết thúc & Chuyển NFT"}
                                        </motion.button>
                                    )}

                                    {/* 2. Dành cho NGƯỜI BÁN (Seller): Đóng phiên & Rút về lịch sử */}
                                    {currentAccount?.address === auction?.seller && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleEndAuction}
                                            className="w-full py-7 bg-white text-black rounded-[30px] font-black text-xl uppercase italic flex items-center justify-center gap-3 border-b-4 border-slate-300 shadow-xl"
                                        >
                                            <History size={24} /> Xác nhận & Đưa vào lịch sử
                                        </motion.button>
                                    )}

                                    {/* 3. Thông báo cho người xem thông thường */}
                                    {currentAccount?.address !== auction?.highestBidder && currentAccount?.address !== auction?.seller && (
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                                            <p className="text-slate-400 italic">Phiên đấu giá đã kết thúc.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Lịch sử thầu */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-4">
                            <Activity className="text-cyan-500" size={16} />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Lịch sử thầu gần đây</span>
                        </div>
                        <div className="space-y-3">
                            <AnimatePresence mode="popLayout">
                                {history.length > 0 ? (
                                    history.map((bid, i) => (
                                        <motion.div
                                            key={`${bid.time}-${bid.amount}-${i}`}
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`flex justify-between items-center p-6 rounded-[30px] border ${i === 0 ? 'bg-cyan-500/10 border-cyan-500/30 shadow-lg shadow-cyan-500/5' : 'bg-white/2 border-white/5'}`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-mono text-cyan-400 text-sm font-bold">
                                                    {bid.bidder.slice(0, 8)}...{bid.bidder.slice(-4)}
                                                </span>
                                                <span className="text-[10px] text-slate-600 font-bold mt-1 uppercase tracking-wider">{bid.time}</span>
                                            </div>
                                            <div className="text-2xl font-black italic">{bid.amount} SUI</div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 border border-dashed border-white/10 rounded-[40px]">
                                        <p className="text-slate-600 uppercase text-[10px] font-black tracking-[0.3em]">Chưa có dữ liệu thầu</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}