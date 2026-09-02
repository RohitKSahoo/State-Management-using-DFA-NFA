import React from 'react';
import { Handle, Position } from '@xyflow/react';

export const CustomStateNode: React.FC<{ data: any; selected?: boolean }> = ({ data, selected }) => {
  const isInitial = data.isInitial;
  const isFinal = data.isFinal;
  const isHighlighted = data.isHighlighted;
  const isCurrentSim = data.isCurrentSim;

  // Determine state category color coding based on type & keywords
  const labelUpper = (data.label || '').toUpperCase();
  
  let borderColor = '#3f3f46'; // Neutral dark zinc border default
  let accentColor = '#a1a1aa'; // Neutral text/icon default
  let borderWidth = '1px';
  let shadowStyle = '0 2px 8px rgba(0,0,0,0.4)';

  if (isInitial && isFinal) {
    borderColor = '#22c55e';
    accentColor = '#22c55e';
    borderWidth = '2px';
    shadowStyle = '0 0 12px rgba(34, 197, 94, 0.4)';
  } else if (isInitial) {
    borderColor = '#22c55e'; // Green for Start
    accentColor = '#22c55e';
    borderWidth = '2px';
    shadowStyle = '0 0 12px rgba(34, 197, 94, 0.35)';
  } else if (isFinal) {
    borderColor = '#ef4444'; // Red for End
    accentColor = '#ef4444';
    borderWidth = '2px';
    shadowStyle = '0 0 12px rgba(239, 68, 68, 0.35)';
  } else if (labelUpper.includes('PAY') || labelUpper.includes('CART') || labelUpper.includes('CHECKOUT')) {
    borderColor = '#3b82f6'; // Blue for Transaction / Action
    accentColor = '#60a5fa';
    borderWidth = '1px';
  } else if (labelUpper.includes('CANCEL') || labelUpper.includes('ERROR') || labelUpper.includes('FAILED') || labelUpper.includes('LOCKED')) {
    borderColor = '#f97316'; // Orange for Exception / Error Trap
    accentColor = '#fb923c';
    borderWidth = '1px';
  } else if (labelUpper.includes('LOAD') || labelUpper.includes('PREPARING') || labelUpper.includes('PENDING') || labelUpper.includes('WAIT')) {
    borderColor = '#a855f7'; // Purple for Async / Processing
    accentColor = '#c084fc';
    borderWidth = '1px';
  }

  if (selected) {
    shadowStyle = '0 0 16px rgba(255, 255, 255, 0.6)';
    borderColor = '#ffffff';
  }

  let bgColor = 'var(--bg-card)';
  let textColor = 'var(--text-primary)';

  if (isCurrentSim) {
    bgColor = '#22c55e';
    textColor = '#000000';
    borderColor = '#ffffff';
    borderWidth = '2px';
    shadowStyle = '0 0 25px rgba(34, 197, 94, 1), 0 0 50px rgba(34, 197, 94, 0.6)';
  } else if (isHighlighted) {
    bgColor = '#27272a';
  }

  return (
    <div
      style={{
        padding: '0.75rem 1.25rem',
        borderRadius: '0px', // Sharp zero radius
        border: `${borderWidth} solid ${borderColor}`,
        backgroundColor: bgColor,
        minWidth: '130px',
        textAlign: 'center',
        boxShadow: shadowStyle,
        position: 'relative',
        transition: 'all 0.15s ease'
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: accentColor, width: '6px', height: '6px', borderRadius: '0px' }} />

      {/* Clean State Name Label */}
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9375rem', color: textColor, letterSpacing: '0.02em' }}>
        {data.label}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: accentColor, width: '6px', height: '6px', borderRadius: '0px' }} />
    </div>
  );
};
