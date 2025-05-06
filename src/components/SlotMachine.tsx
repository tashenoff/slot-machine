'use client';

import { useEffect, useState } from 'react';
import slotConfig from '../config/slot-machine.json';

interface Symbol {
  id: string;
  symbol: string;
  value: number;
}

export default function SlotMachine() {
  const [reels, setReels] = useState<Symbol[][]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinComplete, setSpinComplete] = useState(false);
  const [finalSymbols, setFinalSymbols] = useState<Symbol[][]>([]);

  useEffect(() => {
    // Инициализация барабанов - каждый барабан содержит 10 символов
    const initialReels = Array(slotConfig.reels)
      .fill(null)
      .map(() => getRandomSymbols(10));
    setReels(initialReels);
    setFinalSymbols(initialReels);
  }, []);

  const getRandomSymbols = (count: number): Symbol[] => {
    return Array(count)
      .fill(null)
      .map(() => {
        const randomIndex = Math.floor(Math.random() * slotConfig.symbols.length);
        return slotConfig.symbols[randomIndex];
      });
  };

  const spin = async () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setSpinComplete(false);

    // Генерируем новые символы
    const newReels = Array(slotConfig.reels)
      .fill(null)
      .map(() => getRandomSymbols(10));
    setReels(newReels);

    // Ждем окончания анимации (2 секунды + задержка для последнего барабана)
    await new Promise(resolve => 
      setTimeout(resolve, 2000 + (slotConfig.reels * 200))
    );
    
    setIsSpinning(false);
    setSpinComplete(true);
  };

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: translateY(0);
          }
          100% {
            /* Высота одного символа 96px (h-24), умножаем на количество символов */
            transform: translateY(-960px);
          }
        }
        
        .reel {
          position: relative;
          height: 288px; /* Ровно 3 символа */
          width: 120px;
          background: white;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        .symbols-container {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .spinning {
          animation: spin 2s cubic-bezier(0.42, 0, 0.58, 1) forwards;
        }
      `}</style>

      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-900 to-purple-600 p-8">
        <div className="bg-yellow-900 p-8 rounded-xl shadow-2xl">
          <div className="flex gap-4 mb-8 p-4 bg-yellow-800 rounded-lg">
            {reels.map((reel, reelIndex) => (
              <div key={reelIndex} className="reel">
                <div 
                  className={`symbols-container ${isSpinning ? 'spinning' : ''}`} 
                  style={{
                    animationDelay: `${reelIndex * 0.2}s`
                  }}
                >
                  {/* Повторяем символы 3 раза для создания эффекта бесконечного вращения */}
                  {[...Array(3)].map((_, iteration) => (
                    reel.map((symbol, symbolIndex) => (
                      <div
                        key={`${reelIndex}-${iteration}-${symbolIndex}`}
                        className="w-24 h-24 flex items-center justify-center text-6xl shrink-0"
                      >
                        {symbol.symbol}
                      </div>
                    ))
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={spin}
            disabled={isSpinning}
            className={`w-full py-4 px-8 text-xl font-bold rounded-lg transition-all ${
              isSpinning
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-yellow-500 hover:bg-yellow-600 active:transform active:scale-95'
            }`}
          >
            {isSpinning ? 'Вращается...' : 'Крутить!'}
          </button>
        </div>
      </div>
    </>
  );
} 