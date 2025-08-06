import React from 'react';
import AudioVisualizer from '../components/AudioVisualizer';

const AudioVisualizerDemo: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-900">
            <div className="relative">
                <AudioVisualizer />
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AudioVisualizerDemo;
