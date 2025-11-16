import React from 'react';

export const LeafIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6c-2.2 2.2-2.2 5.8 0 8-2.2-2.2-5.8-2.2-8 0-2.2 2.2-2.2 5.8 0 8" />
    <path d="M4 18c2.2-2.2 2.2-5.8 0-8 2.2 2.2 5.8 2.2 8 0 2.2-2.2 2.2-5.8 0-8" />
  </svg>
);
