'use client';

import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import slotConfig from '../config/slot-machine.json';
import Balance from './Balance';
import Bet from './Bet';
import Jackpot from './Jackpot';
import FreeSpins from './FreeSpins';

interface Symbol {
  id: string;
  symbol: string;
  value: number;
}

interface WinResult {
  amount: number;
  name: string;
  isConsolation?: boolean;
  lineType?: 'horizontal' | 'diagonal-lr' | 'diagonal-rl' | 'vertical';
  position?: number;
  isFreeSpins?: boolean;
}

export default function SlotMachine() {
  const [reels, setReels] = useState<Symbol[][]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<WinResult | null>(null);
  const nextSymbolsRef = useRef<Symbol[][]>([]);
  const { 
    bet, 
    balance, 
    updateBalance, 
    increaseJackpot, 
    freeSpinsCount,
    isFreeSpin,
    multiplier,
    setFreeSpins,
    decrementFreeSpins
  } = useGameStore();

  useEffect(() => {
    // Генерируем начальные символы при загрузке
    const initialReels = Array(slotConfig.reels)
      .fill(null)
      .map(() => getRandomSymbols(slotConfig.symbols.length));
    setReels(initialReels);
    nextSymbolsRef.current = initialReels;
  }, []);

  const getRandomSymbols = (count: number): Symbol[] => {
    return Array(count)
      .fill(null)
      .map(() => {
        const randomIndex = Math.floor(Math.random() * slotConfig.symbols.length);
        return slotConfig.symbols[randomIndex];
      });
  };

  const checkCenterMatch = (symbols: Symbol[][]): WinResult | null => {
    // Проверяем все три горизонтальные линии
    for (let row = 0; row < 3; row++) {
      const lineSymbols = symbols.map(reel => reel[row]);
      
      if (lineSymbols[0].id === lineSymbols[1].id && lineSymbols[1].id === lineSymbols[2].id) {
        const consolationAmount = Math.floor(bet * slotConfig.gameSettings.consolationPrize);
        const position = row === 0 ? "верхней" : row === 1 ? "центральной" : "нижней";
        return {
          amount: consolationAmount,
          name: `Утешительный приз - Три ${lineSymbols[0].symbol} на ${position} линии`,
          isConsolation: true,
          lineType: 'horizontal',
          position: row
        };
      }
    }

    // Проверяем диагональ слева направо (↘)
    const diagonalLR = [symbols[0][0], symbols[1][1], symbols[2][2]];
    if (diagonalLR[0].id === diagonalLR[1].id && diagonalLR[1].id === diagonalLR[2].id) {
      const consolationAmount = Math.floor(bet * slotConfig.gameSettings.consolationPrize);
      return {
        amount: consolationAmount,
        name: `Утешительный приз - Три ${diagonalLR[0].symbol} по диагонали ↘`,
        isConsolation: true,
        lineType: 'diagonal-lr'
      };
    }

    // Проверяем диагональ справа налево (↙)
    const diagonalRL = [symbols[0][2], symbols[1][1], symbols[2][0]];
    if (diagonalRL[0].id === diagonalRL[1].id && diagonalRL[1].id === diagonalRL[2].id) {
      const consolationAmount = Math.floor(bet * slotConfig.gameSettings.consolationPrize);
      return {
        amount: consolationAmount,
        name: `Утешительный приз - Три ${diagonalRL[0].symbol} по диагонали ↙`,
        isConsolation: true,
        lineType: 'diagonal-rl'
      };
    }
    
    return null;
  };

  const checkWin = (symbols: Symbol[]): WinResult | null => {
    const payline = slotConfig.paylines.find(payline => 
      payline.combination.every((symbolId, index) => 
        symbols[index].id === symbolId
      )
    );
    
    if (payline) {
      if (payline.isJackpot) {
        return {
          amount: useGameStore.getState().jackpot,
          name: payline.name
        };
      }
      return {
        amount: bet * (payline.multiplier || 0),
        name: payline.name
      };
    }
    
    return null;
  };

  const prepareReelsForSpin = () => {
    const newSymbols = reels.map((currentReel) => {
      const newReel = getRandomSymbols(slotConfig.symbols.length);
      return [...currentReel, ...newReel];
    });
    return newSymbols;
  };

  const checkFreeSpins = (symbols: Symbol[][]): WinResult | null => {
    // Проверяем горизонтальные линии
    for (let row = 0; row < 3; row++) {
      const lineSymbols = symbols.map(reel => reel[row]);
      if (lineSymbols.every(symbol => symbol.id === 'freespin')) {
        return {
          amount: 0,
          name: 'Бесплатные вращения!',
          lineType: 'horizontal',
          position: row,
          isFreeSpins: true
        };
      }
    }

    // Проверяем вертикальные линии
    for (let col = 0; col < 3; col++) {
      const lineSymbols = symbols[col];
      if (lineSymbols.every(symbol => symbol.id === 'freespin')) {
        return {
          amount: 0,
          name: 'Бесплатные вращения!',
          lineType: 'vertical',
          position: col,
          isFreeSpins: true
        };
      }
    }

    // Проверяем диагональ слева направо
    const diagonalLR = [symbols[0][0], symbols[1][1], symbols[2][2]];
    if (diagonalLR.every(symbol => symbol.id === 'freespin')) {
      return {
        amount: 0,
        name: 'Бесплатные вращения!',
        lineType: 'diagonal-lr',
        isFreeSpins: true
      };
    }

    // Проверяем диагональ справа налево
    const diagonalRL = [symbols[0][2], symbols[1][1], symbols[2][0]];
    if (diagonalRL.every(symbol => symbol.id === 'freespin')) {
      return {
        amount: 0,
        name: 'Бесплатные вращения!',
        lineType: 'diagonal-rl',
        isFreeSpins: true
      };
    }

    return null;
  };

  const spin = async () => {
    if (isSpinning) return;
    if (!isFreeSpin && balance < bet) return;
    
    setLastWin(null);
    if (!isFreeSpin) {
      updateBalance(-bet);
      const jackpotContribution = Math.floor(bet * slotConfig.gameSettings.jackpotContribution);
      increaseJackpot(jackpotContribution);
    }
    
    setIsSpinning(true);

    const preparedReels = prepareReelsForSpin();
    setReels(preparedReels);

    await new Promise(resolve => 
      setTimeout(resolve, slotConfig.animation.duration + (slotConfig.reels * slotConfig.animation.delayBetweenReels))
    );
    
    const finalSymbols = preparedReels.map(reel => {
      const visibleSymbols = reel.slice(-slotConfig.symbols.length);
      return visibleSymbols;
    });
    
    setReels(finalSymbols);
    
    // Проверяем фри спины
    const freeSpinsResult = checkFreeSpins(finalSymbols);
    if (freeSpinsResult) {
      setLastWin(freeSpinsResult);
      setFreeSpins(slotConfig.gameSettings.freeSpins.count);
      setIsSpinning(false);
      return;
    }

    // Проверяем обычный выигрыш
    const winResult = checkWin(finalSymbols.map(reel => reel[0]));
    if (winResult) {
      const winAmount = isFreeSpin ? winResult.amount * multiplier : winResult.amount;
      updateBalance(winAmount);
      setLastWin({
        ...winResult,
        amount: winAmount
      });
      
      if (winResult.name.includes('Джекпот')) {
        useGameStore.getState().resetJackpot();
      }
    } else {
      const consolationWin = checkCenterMatch(finalSymbols);
      if (consolationWin) {
        const consolationAmount = isFreeSpin ? consolationWin.amount * multiplier : consolationWin.amount;
        updateBalance(consolationAmount);
        setLastWin({
          ...consolationWin,
          amount: consolationAmount
        });
      }
    }

    if (isFreeSpin) {
      decrementFreeSpins();
    }
    
    setIsSpinning(false);
  };

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-${slotConfig.symbols.length * slotConfig.animation.symbolHeight}px);
          }
        }
        
        @keyframes win-pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        
        .reel {
          position: relative;
          height: ${slotConfig.animation.symbolHeight * 3}px;
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
          transform: translateY(0);
          will-change: transform;
        }
        
        .spinning {
          animation: spin 2s cubic-bezier(0.42, 0, 0.58, 1) forwards;
        }
        
        .win-animation {
          animation: win-pulse 0.5s ease-in-out infinite;
        }

        .consolation {
          background: rgba(255, 215, 0, 0.2);
        }
      `}</style>

      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-900 to-purple-600 p-8">
        <div className="w-full max-w-4xl mx-auto grid grid-cols-3 gap-4 mb-8">
          <Balance />
          <Jackpot />
          <Bet />
        </div>

        {(freeSpinsCount > 0 || isFreeSpin) && (
          <div className="w-full max-w-4xl mx-auto mb-8">
            <FreeSpins />
          </div>
        )}

        <div className="bg-yellow-900 p-8 rounded-xl shadow-2xl">
          <div className="flex gap-4 mb-8 p-4 bg-yellow-800 rounded-lg">
            {reels.map((reel, reelIndex) => (
              <div key={reelIndex} className="reel">
                <div 
                  className={`symbols-container ${isSpinning ? 'spinning' : ''}`} 
                  style={{
                    animationDelay: `${reelIndex * slotConfig.animation.delayBetweenReels}ms`
                  }}
                >
                  {reel.map((symbol, symbolIndex) => (
                    <div
                      key={`${reelIndex}-${symbolIndex}`}
                      className={`w-24 h-24 flex items-center justify-center text-6xl shrink-0 
                        ${!isSpinning && lastWin && !lastWin.isConsolation && symbolIndex === 0 ? 'win-animation' : ''}
                        ${!isSpinning && lastWin && lastWin.isConsolation ? 
                          (lastWin.lineType === 'horizontal' && symbolIndex === lastWin.position) ||
                          (lastWin.lineType === 'diagonal-lr' && ((reelIndex === 0 && symbolIndex === 0) || 
                                                                 (reelIndex === 1 && symbolIndex === 1) || 
                                                                 (reelIndex === 2 && symbolIndex === 2))) ||
                          (lastWin.lineType === 'diagonal-rl' && ((reelIndex === 0 && symbolIndex === 2) || 
                                                                 (reelIndex === 1 && symbolIndex === 1) || 
                                                                 (reelIndex === 2 && symbolIndex === 0)))
                          ? 'consolation win-animation' : '' : ''}`}
                    >
                      {symbol.symbol}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {lastWin && (
            <div className={`mb-4 text-center ${lastWin.isConsolation ? 'text-yellow-300' : 'text-yellow-400'}`}>
              <div className="text-2xl font-bold animate-bounce">
                {lastWin.name}
              </div>
              <div className="text-xl text-white">
                Выигрыш: {lastWin.amount.toLocaleString('ru-RU')} ₽
              </div>
            </div>
          )}
          
          <button
            onClick={spin}
            disabled={isSpinning || balance < bet}
            className={`w-full py-4 px-8 text-xl font-bold rounded-lg transition-all ${
              isSpinning || balance < bet
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-yellow-500 hover:bg-yellow-600 active:transform active:scale-95'
            }`}
          >
            {isSpinning ? 'Вращается...' : balance < bet ? 'Недостаточно средств' : 'Крутить!'}
          </button>
        </div>
      </div>
    </>
  );
} 