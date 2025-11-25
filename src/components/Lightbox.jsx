import React from 'react';
import { X } from 'lucide-react';

const Lightbox = ({ src, onClose }) => {
    if (!src) return null;
    return (
        <div className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center p-4" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 text-white"><X size={32} /></button>
            <img src={src} alt="Full size" className="max-w-full max-h-[90vh] object-contain rounded" />
        </div>
    );
};
export default Lightbox;