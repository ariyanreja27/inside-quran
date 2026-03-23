import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = "Loading content..." }: LoadingScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
    >
      <div className="relative flex flex-col items-center">
        {/* Decorative background glow */}
        <div className="absolute -inset-4 bg-primary/5 blur-2xl rounded-full" />
        
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="text-primary mb-6"
        >
          <Loader2 size={40} strokeWidth={2.5} />
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display text-lg font-medium text-foreground/80 tracking-wide"
        >
          {message}
        </motion.p>
        
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: 100 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="h-[2px] bg-primary/20 mt-4 rounded-full overflow-hidden"
        >
          <motion.div
            animate={{ x: [-100, 100] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-full bg-primary"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
