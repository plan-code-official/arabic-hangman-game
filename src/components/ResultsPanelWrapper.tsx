import React, { useEffect, useRef } from 'react';
import { ResultsPanel } from '../ResultsPanel/ResultsPanel';

interface ResultsPanelProps {
  score: number;
  totalScore?: number;
  correctAnswers: number;
  wrongAnswers: number;
  coins: number;
  onRetry?: () => void;
  onBack?: () => void;
}

const ResultsPanelWrapper: React.FC<ResultsPanelProps> = (props) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<any>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    
    panelRef.current = new ResultsPanel(rootRef.current, {
      onRetry: props.onRetry,
      onBack: props.onBack
    });
    
    return () => {
      if (panelRef.current) {
        panelRef.current.hide();
      }
    };
  }, [props.onRetry, props.onBack]);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.show({
        score: props.score,
        totalScore: props.totalScore,
        correctAnswers: props.correctAnswers,
        wrongAnswers: props.wrongAnswers,
        coins: props.coins
      });
    }
  }, [props.score, props.totalScore, props.correctAnswers, props.wrongAnswers, props.coins]);

  return <div ref={rootRef} className="results-panel-wrapper" />;
};

export default ResultsPanelWrapper;
