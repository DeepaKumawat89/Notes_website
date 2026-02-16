import React from 'react';

const NoteSkeleton = () => {
    return (
        <div className="relative bg-white rounded-[2.5rem] p-8 border border-pista-light/20 overflow-hidden">
            {/* Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-pista-light/10 to-transparent shadow-[100px_0_100px_rgba(255,255,255,0.2)]"></div>

            {/* Thumbnail Skeleton */}
            <div className="w-full h-40 bg-pista-light/20 rounded-2xl mb-6"></div>

            {/* Title Skeleton */}
            <div className="h-6 w-3/4 bg-pista-light/20 rounded-full mb-3"></div>

            {/* Subtitle Skeleton */}
            <div className="h-4 w-1/2 bg-pista-light/10 rounded-full mb-8"></div>

            {/* Footer Skeleton */}
            <div className="flex items-center space-x-4 pt-6 border-t border-pista-light/30">
                <div className="h-3 w-20 bg-pista-light/10 rounded-full"></div>
                <div className="flex-1"></div>
                <div className="h-10 w-24 bg-pista-light/20 rounded-xl"></div>
            </div>
        </div>
    );
};

export default NoteSkeleton;
