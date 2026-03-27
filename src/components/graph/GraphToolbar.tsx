import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';

interface GraphToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export const GraphToolbar: React.FC<GraphToolbarProps> = ({ onZoomIn, onZoomOut, onFit, onRefresh, loading }) => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-full p-1.5 shadow-2xl">
      <button onClick={onZoomIn} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-emerald-500">
        <ZoomIn className="w-4 h-4" />
      </button>
      <button onClick={onZoomOut} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-emerald-500">
        <ZoomOut className="w-4 h-4" />
      </button>
      <div className="w-px h-4 bg-zinc-800 mx-1" />
      <button onClick={onFit} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-emerald-500">
        <Maximize2 className="w-4 h-4" />
      </button>
      <button onClick={onRefresh} disabled={loading} className={`p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-emerald-500 ${loading ? 'animate-spin opacity-50' : ''}`}>
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );
};
