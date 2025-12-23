import React, { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, Zap, Clock, Tag, FileText,
    Loader2, X, ChevronRight, AlertCircle, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Giữ nguyên JWT và Package ID
const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI5NjRiZDE0OS1mNTQ4LTRiYzAtODZjOS1kNzJlZjljMTZjZTYiLCJlbWFpbCI6Imx1YW4xNDEwMjAwNWluQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiIzODg3MTBkZDcxNTY2ZTRlYzhjMiIsInNjb3BlZEtleVNlY3JldCI6IjE5NTAxMGQ0ZGY5ODY2YjIwMmFlOGExMjFmMDVlNTQ3ZGI3MjA1Mjk4NDVkMjFhMTEwYTFlZjA5MDAwMGE3MDQiLCJleHAiOjE3OTc4NzMyOTB9.J6n9nFxVE1Om2j9F4AVaoglkxL-cVT4cRr90gj0vIag";
const PACKAGE_ID = "0x01917a9923bd2a7e3cc11fb493a98cf2291703efd1879e5c4b6cf08125fdad08";

const SuiIcon = () => (
    <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 0C22.3858 0 0 22.3858 0 50C0 77.6142 22.3858 100 50 100C77.6142 100 100 77.6142 100 50C100 22.3858 77.6142 0 50 0Z" fill="#38BDF8" fillOpacity="0.2" />
        <path d="M49.9 15.1C30.7 15.1 15.1 30.7 15.1 49.9C15.1 69.1 30.7 84.7 49.9 84.7C69.1 84.7 84.7 69.1 84.7 49.9C84.7 30.7 69.1 15.1 49.9 15.1ZM65.8 54.1L51.9 68C50.8 69.1 49 69.1 47.9 68L34 54.1C32.9 53 32.9 51.2 34 50.1C35.1 49 36.9 49 38 50.1L46.5 58.6V34C46.5 32.5 47.7 31.3 49.2 31.3C50.7 31.3 51.9 32.5 51.9 34V58.6L60.4 50.1C61.5 49 63.3 49 64.4 50.1C66.9 51.2 66.9 53 65.8 54.1Z" fill="#38BDF8" />
    </svg>
);

export default function CreateAuction() {
    const account = useCurrentAccount();
    const client = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const navigate = useNavigate();

    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startPrice: '',
        hours: '24',
        minutes: '0'
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const uploadToIPFS = async (file) => {
        const data = new FormData();
        data.append('file', file);

        const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${PINATA_JWT.trim()}`
            },
            body: data
        });

        if (!response.ok) {
            const errorDetail = await response.json();
            throw new Error(`Pinata error: ${JSON.stringify(errorDetail)}`);
        }

        const res = await response.json();
        return res.IpfsHash;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!account) return toast.error("Vui lòng kết nối ví!");
        if (!selectedFile) return toast.error("Vui lòng tải lên hình ảnh!");

        // KÍCH HOẠT OVERLAY GIỮA MÀN HÌNH
        setIsProcessing(true);

        try {
            const cid = await uploadToIPFS(selectedFile);

            const finalNameOnChain = `${formData.name.trim()} | ${formData.description.trim()}`;
            const priceInMist = BigInt(Math.floor(parseFloat(formData.startPrice) * 1_000_000_000));
            const totalMs = (parseInt(formData.hours || 0) * 3600 + parseInt(formData.minutes || 0) * 60) * 1000;
            const durationInMs = BigInt(totalMs);

            const txb = new Transaction();
            txb.moveCall({
                target: `${PACKAGE_ID}::charity_auction::mint_and_auction`,
                arguments: [
                    txb.pure.string(finalNameOnChain),
                    txb.pure.string(cid),
                    txb.pure.u64(priceInMist),
                    txb.pure.u64(durationInMs),
                    txb.object('0x6'),
                ],
            });

            signAndExecute({ transaction: txb }, {
                onSuccess: async (result) => {
                    await client.waitForTransaction({ digest: result.digest });
                    setIsProcessing(false); // TẮT OVERLAY
                    toast.success("ĐÃ ĐƯA TRANH LÊN SÀN THÀNH CÔNG!");
                    navigate('/');
                },
                onError: (err) => {
                    setIsProcessing(false); // TẮT OVERLAY ĐỂ HIỆN LỖI
                    toast.error(`Giao dịch thất bại: ${err.message}`);
                }
            });
        } catch (err) {
            setIsProcessing(false); // TẮT OVERLAY
            toast.error(err.message);
        }
    };

    return (
        <div className="pt-32 pb-20 min-h-screen bg-[#050810] text-white relative overflow-hidden">

            {/* --- COMPONENT THÔNG BÁO CHÍNH GIỮA MÀN HÌNH (MODAL) --- */}
            <AnimatePresence>
                {isProcessing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[#0A1120] border border-blue-500/30 p-10 rounded-[40px] shadow-[0_0_50px_rgba(37,99,235,0.2)] flex flex-col items-center max-w-sm w-full mx-6"
                        >
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse" />
                                <Loader2 className="animate-spin text-blue-500 relative z-10" size={50} />
                            </div>

                            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2 text-center">
                                Đang xử lý <span className="text-blue-500">Dữ liệu</span>
                            </h3>

                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] text-center leading-relaxed">
                                Hệ thống đang nạp tranh lên IPFS <br /> & xác thực trên Sui Blockchain
                            </p>

                            <div className="mt-8 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-blue-600"
                                    animate={{ x: ["-100%", "100%"] }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Glows */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <header className="text-center mb-16 space-y-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40"
                    >
                        CREATE <span className="text-blue-500">IMPACT</span>
                    </motion.h1>
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-px w-12 bg-blue-500/50" />
                        <p className="text-blue-400 font-black uppercase tracking-[0.4em] text-[10px]">Đúc NFT & Mở đấu giá từ thiện</p>
                        <div className="h-px w-12 bg-blue-500/50" />
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* LEFT: MEDIA UPLOAD AREA */}
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="lg:col-span-5 space-y-6">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[45px] blur opacity-20 group-hover:opacity-40 transition duration-700" />
                            <div className="relative bg-[#0A1120] border border-white/10 rounded-[40px] p-4 min-h-[500px] flex flex-col items-center justify-center overflow-hidden shadow-2xl">
                                <AnimatePresence mode='wait'>
                                    {preview ? (
                                        <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full h-full flex flex-col items-center">
                                            <img src={preview} className="w-full aspect-square object-cover rounded-[32px] shadow-2xl" alt="Preview" />
                                            <button onClick={() => { setPreview(null); setSelectedFile(null); }} className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full hover:bg-red-500 transition-colors">
                                                <X size={20} />
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center p-10 space-y-6">
                                            <div className="w-24 h-24 bg-blue-500/5 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
                                                <Upload className="text-blue-500 animate-bounce" size={32} />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-black italic uppercase">Tải lên tác phẩm</h3>
                                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Hỗ trợ JPG, PNG, GIF (Max 10MB)</p>
                                            </div>
                                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT: FORM DATA AREA */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-7">
                        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[50px] p-8 md:p-12 space-y-10 shadow-3xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                                        <Tag size={12} /> Tên vật phẩm
                                    </label>
                                    <input required name="name" placeholder="VÍ DỤ: TRỜI ĐÊM ĐÀ LẠT..." className="w-full bg-black/40 px-6 py-5 rounded-[22px] border border-white/5 outline-none focus:border-blue-500/50 transition-all font-black uppercase text-xs" onChange={handleInputChange} />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                                        <SuiIcon /> Giá khởi điểm (SUI)
                                    </label>
                                    <input required name="startPrice" type="number" step="0.1" placeholder="0.00" className="w-full bg-black/40 px-6 py-5 rounded-[22px] border border-white/5 outline-none focus:border-blue-500/50 transition-all font-black text-sm text-blue-400" onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                                    <FileText size={12} /> Miêu tả chi tiết
                                </label>
                                <textarea required name="description" placeholder="CHIA SẺ CÂU CHUYỆN VÀ MỤC ĐÍCH THIỆN NGUYỆN..." rows="4" className="w-full bg-black/40 p-6 rounded-[30px] border border-white/5 outline-none focus:border-blue-500/50 transition-all text-xs font-bold uppercase leading-relaxed" onChange={handleInputChange} />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                                    <Clock size={12} /> Thời hạn đấu giá
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center bg-black/40 rounded-[22px] border border-white/5 pr-4 focus-within:border-blue-500/50 transition-all">
                                        <input required name="hours" type="number" min="0" className="w-full bg-transparent px-6 py-5 outline-none font-black text-xs" placeholder="GIỜ" onChange={handleInputChange} />
                                        <span className="text-[10px] font-black text-slate-600 uppercase">H</span>
                                    </div>
                                    <div className="flex items-center bg-black/40 rounded-[22px] border border-white/5 pr-4 focus-within:border-blue-500/50 transition-all">
                                        <input required name="minutes" type="number" min="0" max="59" className="w-full bg-transparent px-6 py-5 outline-none font-black text-xs" placeholder="PHÚT" onChange={handleInputChange} />
                                        <span className="text-[10px] font-black text-slate-600 uppercase">M</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={isProcessing}
                                    className={`w-full py-8 rounded-[35px] font-black uppercase italic tracking-[0.2em] text-lg transition-all flex items-center justify-center gap-4 ${isProcessing
                                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-white hover:text-blue-600 text-white shadow-2xl shadow-blue-500/20'
                                        }`}
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                                    {isProcessing ? "ĐANG XỬ LÝ..." : "BẮT ĐẦU ĐẤU GIÁ"}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}