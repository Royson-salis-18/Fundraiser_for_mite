import React from 'react';

const overlayStyle = {
  position: 'fixed',  
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2rem 0',
  zIndex: 1000,
};

const cardStyle = {
  background: '#fff',
  borderRadius: '12px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
  width: 'min(92vw, 720px)',
  padding: '20px',
};

const OverlayCard = ({ title, onClose, children }) => {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default OverlayCard;