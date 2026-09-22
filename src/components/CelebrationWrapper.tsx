import React, { useEffect, useRef } from 'react';
import { Celebration } from '../Celebration/Celebration';

interface CelebrationProps {
  isVisible: boolean;
  onComplete?: () => void;
  muted?: boolean;
  soundUrl?: string;
  imageSrc?: string;
}

const CelebrationWrapper: React.FC<CelebrationProps> = ({ isVisible, onComplete, muted, soundUrl, imageSrc }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const celebrationRef = useRef<any>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    
    // Initialize the Celebration instance
    celebrationRef.current = new Celebration(rootRef.current, { muted, soundUrl, imageSrc });
    
    return () => {
      if (celebrationRef.current) {
        celebrationRef.current.hide();
      }
    };
  }, [muted, soundUrl, imageSrc]);

  useEffect(() => {
    if (celebrationRef.current) {
      if (isVisible) {
        celebrationRef.current.show(onComplete);
      } else {
        celebrationRef.current.hide();
      }
    }
  }, [isVisible, onComplete]);

  return <div ref={rootRef} className="celebration-wrapper" />;
};

export default CelebrationWrapper;
