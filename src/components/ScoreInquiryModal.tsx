import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, ExternalLink, AlertCircle } from 'lucide-react';

interface ScoreInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScoreInquiryModal({ isOpen, onClose }: ScoreInquiryModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-slate-50 border-4 border-slate-900 rounded-[2rem] shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 sm:p-8 bg-sky-300 border-b-4 border-slate-900 relative overflow-hidden shrink-0">
            <div className="absolute right-0 top-0 opacity-10 translate-x-1/4 -translate-y-1/4">
              <Search className="w-48 h-48 text-slate-900" />
            </div>
            <div className="flex items-center justify-between relative z-10 gap-4">
              <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-fuchsia-300 border-4 border-slate-900 rounded-2xl flex items-center justify-center shrink-0 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] -rotate-3">
                <Search className="w-7 h-7 text-slate-900" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                  會考成績查詢
                </h2>
                <p className="text-sm font-bold text-slate-500 mt-1">請選擇成績查詢網路分流</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-12 h-12 bg-white rounded-2xl border-4 border-slate-900 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:bg-slate-100 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] transition-all active:translate-y-0 active:shadow-none shrink-0"
            >
              <X className="w-6 h-6 text-slate-900" />
            </button>
          </div>
          </div>

          <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar space-y-6">
            
            <div className="bg-white border-4 border-slate-900 rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex gap-4 text-slate-700">
              <div className="w-11 h-11 rounded-2xl border-2 border-slate-900 bg-amber-300 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                <AlertCircle className="w-5 h-5 text-slate-900" />
              </div>
              <div className="text-sm font-bold leading-relaxed">
                因查詢人數眾多，為維持系統穩定，試務會提供兩個分流網站，請擇一查詢。若連線緩慢請耐心等候或切換另一網站。
              </div>
            </div>

            <a
              href="https://score_n.rcpet.edu.tw/Login.aspx"
              target="_blank"
              rel="noreferrer"
              className="group relative w-full flex items-center justify-between p-5 bg-white border-4 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all"
            >
              <div className="flex flex-col">
                <span className="font-black text-lg text-slate-900">成績查詢網站 1</span>
                <span className="text-sm text-slate-500 font-bold">score_n.rcpet.edu.tw</span>
              </div>
              <div className="w-11 h-11 rounded-xl border-2 border-slate-900 bg-fuchsia-300 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] group-hover:-rotate-3 transition-transform">
                <ExternalLink className="w-5 h-5 text-slate-900" />
              </div>
            </a>

            <a
              href="https://score_s.rcpet.edu.tw/Login.aspx"
              target="_blank"
              rel="noreferrer"
              className="group relative w-full flex items-center justify-between p-5 bg-white border-4 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all"
            >
              <div className="flex flex-col">
                <span className="font-black text-lg text-slate-900">成績查詢網站 2</span>
                <span className="text-sm text-slate-500 font-bold">score_s.rcpet.edu.tw</span>
              </div>
              <div className="w-11 h-11 rounded-xl border-2 border-slate-900 bg-fuchsia-300 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] group-hover:-rotate-3 transition-transform">
                <ExternalLink className="w-5 h-5 text-slate-900" />
              </div>
            </a>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
