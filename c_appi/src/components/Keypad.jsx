import React from 'react';

/**
 * Keypad component
 * Props:
 * - keypadTarget: { type, index }
 * - keypadValue: string
 * - onKeyPress: (key) => void   // called for any key pressed (digits, '.', '←', 'C')
 * - onAccept: () => void        // called when 'Aceptar' pressed
 * - onPresetPress: (amount, isCurrency) => void
 */
export default function Keypad({ keypadTarget, keypadValue, onKeyPress, onAccept, onPresetPress }) {
  const keys = ['1','2','3', '←', '4','5','6', 'C', '7','8','9', keypadTarget?.type === 'monto' ? '.' : '00', '0', 'Aceptar'];

  const handleKey = (k) => {
    if (k === 'Aceptar') return onAccept && onAccept();
    return onKeyPress && onKeyPress(k);
  };

  const handleKeyDown = (e) => {
    const k = e.key;
    if (/^[0-9]$/.test(k)) return onKeyPress && onKeyPress(k);
    if (k === 'Enter') return onAccept && onAccept();
    if (k === 'Backspace') return onKeyPress && onKeyPress('←');
    if (k === 'Escape') return onKeyPress && onKeyPress('C');
    if (k === '.') return onKeyPress && onKeyPress('.');
  };

  return (
    <div
      role="region"
      aria-label="Teclado numérico de ventas"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="w-full"
    >
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 mb-2">
        {[1,5,10].map(a => (
          <button key={a} type="button" onClick={() => onPresetPress && onPresetPress(a, false)} className="w-full h-9 sm:h-10 flex items-center justify-center bg-gray-700 rounded text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">+{a}</button>
        ))}
        {keypadTarget?.type === 'monto' && [20,50,100].map(a => (
          <button key={a} type="button" onClick={() => onPresetPress && onPresetPress(a, true)} className="w-full h-9 sm:h-10 flex items-center justify-center bg-blue-600 rounded text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">${a}</button>
        ))}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => handleKey(k)}
            aria-label={k === '←' ? 'Retroceso' : (k === 'C' ? 'Limpiar' : (k === 'Aceptar' ? 'Aceptar' : `Tecla ${k}`))}
            className={`h-12 sm:h-14 flex items-center justify-center bg-gray-800 rounded text-white text-lg sm:text-2xl shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${k === 'Aceptar' ? 'col-span-3 sm:col-span-4 bg-green-600 hover:bg-green-500' : (k === 'C' || k === '←' ? 'bg-red-600 hover:bg-red-500' : 'hover:bg-gray-700')}`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
