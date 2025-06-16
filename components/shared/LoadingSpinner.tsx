
import React from 'react';

const LoadingSpinner: React.FC<{ size?: string; message?: string }> = ({ size = 'w-8 h-8', message }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 border-blue-500`}></div>
      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;