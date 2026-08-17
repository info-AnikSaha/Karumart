import React from 'react';

interface KarumartLogoProps {
  className?: string;
  size?: number | string;
}

export const KarumartLogo: React.FC<KarumartLogoProps> = ({ className = '', size = 48 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Soft Glow / Clear Container */}
      <defs>
        <linearGradient id="karuBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00A3E0" />
          <stop offset="100%" stopColor="#0077C8" />
        </linearGradient>
        <linearGradient id="karuGreenGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#68BC00" />
          <stop offset="100%" stopColor="#8AD300" />
        </linearGradient>
        <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#003300" floodOpacity="0.12" />
        </filter>
      </defs>

      <g filter="url(#logoShadow)">
        {/* Shopping Cart Base & Wheels (Green) */}
        <path
          d="M 120 140 L 175 250 L 330 250 C 345 250 355 240 360 225 L 380 150 L 160 150"
          stroke="url(#karuGreenGrad)"
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="210" cy="380" r="24" fill="url(#karuGreenGrad)" />
        <circle cx="340" cy="380" r="24" fill="url(#karuGreenGrad)" />
        
        {/* Lower Cart Support (Green) */}
        <path
          d="M 175 250 C 200 340 230 350 350 350"
          stroke="url(#karuGreenGrad)"
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Upward Growth Arrow (Green) */}
        <path
          d="M 230 290 Q 320 270 380 180 L 415 140"
          stroke="url(#karuGreenGrad)"
          strokeWidth="28"
          strokeLinecap="round"
        />
        <path
          d="M 360 140 L 420 135 L 415 195 Z"
          fill="url(#karuGreenGrad)"
          stroke="url(#karuGreenGrad)"
          strokeWidth="8"
          strokeLinejoin="round"
        />

        {/* K-Swoosh Left Line (Blue) */}
        <path
          d="M 140 390 L 220 130"
          stroke="url(#karuBlueGrad)"
          strokeWidth="32"
          strokeLinecap="round"
        />

        {/* Dynamic Blue Arc Swoosh (Top-Right Loop) */}
        <path
          d="M 150 380 C 220 220 310 90 380 100 C 410 105 405 150 370 190 C 330 230 260 270 210 280"
          stroke="url(#karuBlueGrad)"
          strokeWidth="30"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};
