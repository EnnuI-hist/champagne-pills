import React from 'react'

interface BrandWordmarkProps {
  size?: 'sm' | 'md' | 'lg'
}

export const BrandWordmark: React.FC<BrandWordmarkProps> = ({ size = 'md' }) => {
  const fontSizes = {
    sm: 'text-base',
    md: 'text-2xl',
    lg: 'text-4xl',
  }
  const ampSizes = {
    sm: 'text-lg',
    md: 'text-3xl',
    lg: 'text-5xl',
  }

  return (
    <span className={`inline-flex items-baseline select-none ${fontSizes[size]}`}>
      <span
        style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic',
          color: '#f3e5ab',
        }}
      >
        champagne
      </span>
      <span
        className={`mx-0.5 ${ampSizes[size]}`}
        style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic',
          color: '#ff2a85',
          textShadow: '0 0 16px rgba(255, 42, 133, 0.6), 0 0 32px rgba(255, 42, 133, 0.3)',
        }}
      >
        &amp;
      </span>
      <span
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 700,
          color: 'rgba(255, 255, 255, 0.92)',
          letterSpacing: '-0.02em',
        }}
      >
        pills
      </span>
    </span>
  )
}
