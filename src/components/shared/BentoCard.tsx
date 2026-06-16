import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';

interface BentoCardProps extends HTMLMotionProps<'div'> {
  delay?: number;
  hoverEffect?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BentoCard({ children, delay = 0, hoverEffect = true, className = '', ...props }: BentoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`
        bg-[var(--color-surface)] 
        text-[var(--color-text-main)] 
        border-2 border-black dark:border-white
        rounded-none 
        p-6 
        transition-all duration-150
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
}
