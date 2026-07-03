import { motion } from 'framer-motion';
import { Phone, Heart } from 'lucide-react';

export function CrisisSupportCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden max-w-md w-full mx-auto my-4"
    >
      <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="bg-slate-200 p-2 rounded-full text-slate-600">
          <Heart size={20} />
        </div>
        <h3 className="font-medium text-slate-800">You are not alone</h3>
      </div>
      
      <div className="p-5 space-y-4">
        <p className="text-slate-600 text-sm leading-relaxed">
          It sounds like you might be going through a really difficult time right now. 
          Please know that there is support available, and people who want to help.
        </p>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Phone size={18} className="text-slate-500 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-slate-800 text-sm">988 Suicide & Crisis Lifeline (US)</div>
              <div className="text-slate-500 text-xs mt-0.5">Call or text 988 (Available 24/7)</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Phone size={18} className="text-slate-500 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-slate-800 text-sm">Samaritans (UK)</div>
              <div className="text-slate-500 text-xs mt-0.5">Call 116 123 (Available 24/7)</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Phone size={18} className="text-slate-500 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-slate-800 text-sm">iCall (India)</div>
              <div className="text-slate-500 text-xs mt-0.5">Call +91 9152987821</div>
            </div>
          </div>
        </div>
        
        <p className="text-xs text-slate-400 italic pt-2 border-t border-slate-100">
          If you are in immediate danger, please contact your local emergency services.
        </p>
      </div>
    </motion.div>
  );
}
