import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { cn } from '@/lib/utils';

type SnapPoint = 'collapsed' | 'mid' | 'full';

interface DraggableBottomSheetProps {
  children: ReactNode;
  header: ReactNode;
  onClose: () => void;
  defaultSnap?: SnapPoint;
  bodyClassName?: string;
  panelClassName?: string;
}

export default function DraggableBottomSheet({
  children,
  header,
  onClose,
  defaultSnap = 'mid',
  bodyClassName,
  panelClassName,
}: DraggableBottomSheetProps) {
  const dragControls = useDragControls();
  const [snap, setSnap] = useState<SnapPoint>(defaultSnap);
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);
  const [isClosing, setIsClosing] = useState(false);

  const layout = useMemo(() => {
    const topGap = 12;
    const bottomGap = 12;
    const availableHeight = Math.max(viewportHeight - topGap - bottomGap, 360);
    const collapsedHeight = Math.min(Math.max(availableHeight * 0.3, 220), 280);
    const midHeight = Math.min(Math.max(availableHeight * 0.68, 460), availableHeight - 56);

    return {
      availableHeight,
      snapOffsets: {
        full: 0,
        mid: Math.max(availableHeight - midHeight, 0),
        collapsed: Math.max(availableHeight - collapsedHeight, 0),
      },
    };
  }, [viewportHeight]);

  useEffect(() => {
    setSnap(defaultSnap);
  }, [defaultSnap]);

  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight);
    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    return () => window.removeEventListener('resize', updateViewportHeight);
  }, []);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, []);

  useEffect(() => {
    if (!isClosing) return;
    const timeout = window.setTimeout(onClose, 220);
    return () => window.clearTimeout(timeout);
  }, [isClosing, onClose]);

  const requestClose = () => {
    if (!isClosing) setIsClosing(true);
  };

  const resolveNearestSnap = (value: number): SnapPoint => {
    const entries = Object.entries(layout.snapOffsets) as Array<[SnapPoint, number]>;
    return entries.reduce((closest, current) =>
      Math.abs(current[1] - value) < Math.abs(closest[1] - value) ? current : closest,
    )[0];
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isClosing ? 0 : 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm"
      onClick={requestClose}
    >
      <div className="absolute inset-x-3 top-3 bottom-3 pointer-events-none">
        <motion.div
          drag="y"
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: layout.availableHeight + 180 }}
          dragElastic={{ top: 0.05, bottom: 0.18 }}
          initial={{ y: layout.availableHeight + 120 }}
          animate={{
            y: isClosing ? layout.availableHeight + 180 : layout.snapOffsets[snap],
          }}
          transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.85 }}
          onDragEnd={(_, info) => {
            const projectedY = layout.snapOffsets[snap] + info.offset.y + info.velocity.y * 0.16;
            const closeThreshold = layout.snapOffsets.collapsed + 120;

            if (projectedY > closeThreshold) {
              requestClose();
              return;
            }

            setSnap(resolveNearestSnap(projectedY));
          }}
          className={cn(
            'pointer-events-auto absolute inset-x-0 bottom-0 flex h-full flex-col overflow-hidden rounded-[28px] border border-border bg-background shadow-2xl',
            panelClassName,
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className="flex cursor-grab justify-center px-4 pb-2 pt-3 active:cursor-grabbing touch-none"
            onPointerDown={(event) => dragControls.start(event)}
          >
            <div className="h-1.5 w-12 rounded-full bg-border" />
          </div>

          <div
            className="shrink-0 cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={(event) => dragControls.start(event)}
          >
            {header}
          </div>

          <div className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain', bodyClassName)}>
            {children}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
