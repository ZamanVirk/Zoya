import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { MicOff, ShieldAlert, Loader2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function PermissionModal({ onClose }: Props) {
  const [checking, setChecking] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const checkMicPermission = useCallback(async () => {
    setChecking(true);
    setErrorStatus(null);
    
    try {
      // First try permissions API (supported in most modern browsers like Chrome/Edge)
      if (navigator.permissions && navigator.permissions.query) {
        const permission = await navigator.permissions.query({ 
          name: 'microphone' as PermissionName 
        });
        
        if (permission.state === 'granted') {
          onClose(); // Auto-dismiss if already allowed
          return;
        }
        
        // Listen for permission changes while the modal is open
        permission.onchange = () => {
          if (permission.state === 'granted') {
            onClose();
          }
        };
      }
      
      // Secondary check or fallback: try getUserMedia to trigger the prompt or verify status
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true 
        });
        // If successful, stop stream immediately and close modal
        stream.getTracks().forEach(track => track.stop());
        onClose();
      } catch (err: any) {
        // If it fails, it means permission is truly blocked or dismissed
        console.warn("Microphone access denied:", err);
        setErrorStatus("Microphone access is still blocked.");
      }
    } catch (err) {
      console.error("Permission check failed:", err);
      // Even if permissions query fails, try getUserMedia fallback
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        onClose();
      } catch {
        setErrorStatus("Unable to access microphone.");
      }
    } finally {
      setChecking(false);
    }
  }, [onClose]);

  useEffect(() => {
    // Initial check on mount
    checkMicPermission();
  }, [checkMicPermission]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.15)] flex flex-col items-center text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-pulse" />
        
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20 relative">
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-red-500"
          />
          <MicOff size={36} className="text-red-500 relative z-10" />
        </div>
        
        <h2 className="text-2xl font-serif font-semibold text-white mb-3">Microphone Blocked</h2>
        <p className="text-white/60 text-sm mb-6 leading-relaxed">
          Zoya needs your microphone to function. Access has been denied or blocked by your browser.
        </p>
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left w-full mb-8">
          <p className="text-sm text-white/90 font-semibold mb-3 flex items-center gap-2">
            <ShieldAlert size={16} className="text-orange-400" />
            Quick Fix:
          </p>
          <ol className="text-xs text-white/50 list-decimal pl-5 space-y-3">
            <li>Click the <strong>Settings/Tune icon</strong> next to the URL bar.</li>
            <li>Enable <strong>Microphone</strong> access for this site.</li>
            <li>Ensure your operating system hasn't muted the browser.</li>
          </ol>
        </div>

        {errorStatus && !checking && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-xs mb-4 font-medium"
          >
            {errorStatus} - Please check browser settings.
          </motion.div>
        )}
        
        <div className="flex flex-col w-full gap-3">
          <button 
            onClick={checkMicPermission}
            disabled={checking}
            className="w-full py-4 px-6 bg-white text-black font-bold rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            {checking ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Checking...
              </>
            ) : (
              "I've allowed it, Re-check Status"
            )}
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 px-6 bg-white/5 text-white/40 font-medium rounded-2xl hover:bg-white/10 hover:text-white/60 transition-all text-sm"
          >
            Close & Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}
