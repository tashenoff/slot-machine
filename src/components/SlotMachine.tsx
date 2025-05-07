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
  hasFourMatch?: boolean;
  matchedRows?: number[];
  isFreeSpin: boolean;
}

export default function SlotMachine() {
  const [reels, setReels] = useState<Symbol[][]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<WinResult | null>(null);
  const [hasFourMatch, setHasFourMatch] = useState(false);
  const [matchedRows, setMatchedRows] = useState<number[]>([]);
  const [matchPosition, setMatchPosition] = useState<'left' | 'right'>('left');
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
    decrementFreeSpins,
    activateFreeSpins
  } = useGameStore();
  const [showRules, setShowRules] = useState(false);

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
      
      if (lineSymbols[0].id === lineSymbols[1].id && 
          lineSymbols[1].id === lineSymbols[2].id && 
          lineSymbols[2].id === lineSymbols[3].id &&
          lineSymbols[3].id === lineSymbols[4].id) {
        const consolationAmount = Math.floor(bet * slotConfig.gameSettings.consolationPrize);
        const position = row === 0 ? "верхней" : row === 1 ? "центральной" : "нижней";
        return {
          amount: consolationAmount,
          name: `Утешительный приз - Пять ${lineSymbols[0].symbol} на ${position} линии`,
          isConsolation: true,
          lineType: 'horizontal',
          position: row,
          isFreeSpin: false
        };
      }
    }

    // Проверяем диагональ слева направо (↘)
    const diagonalLR = [symbols[0][0], symbols[1][1], symbols[2][2], symbols[3][2], symbols[4][2]];
    if (diagonalLR[0].id === diagonalLR[1].id && 
        diagonalLR[1].id === diagonalLR[2].id && 
        diagonalLR[2].id === diagonalLR[3].id &&
        diagonalLR[3].id === diagonalLR[4].id) {
      const consolationAmount = Math.floor(bet * slotConfig.gameSettings.consolationPrize);
      return {
        amount: consolationAmount,
        name: `Утешительный приз - Пять ${diagonalLR[0].symbol} по диагонали ↘`,
        isConsolation: true,
        lineType: 'diagonal-lr',
        isFreeSpin: false
      };
    }

    // Проверяем диагональ справа налево (↙)
    const diagonalRL = [symbols[0][2], symbols[1][1], symbols[2][0], symbols[3][0], symbols[4][0]];
    if (diagonalRL[0].id === diagonalRL[1].id && 
        diagonalRL[1].id === diagonalRL[2].id && 
        diagonalRL[2].id === diagonalRL[3].id &&
        diagonalRL[3].id === diagonalRL[4].id) {
      const consolationAmount = Math.floor(bet * slotConfig.gameSettings.consolationPrize);
      return {
        amount: consolationAmount,
        name: `Утешительный приз - Пять ${diagonalRL[0].symbol} по диагонали ↙`,
        isConsolation: true,
        lineType: 'diagonal-rl',
        isFreeSpin: false
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
    // Проверяем горизонтальные линии на 5 совпадений
    for (let row = 0; row < 3; row++) {
      const lineSymbols = symbols.map(reel => reel[row]);
      // Проверяем, что все 5 символов - это freespin
      if (lineSymbols.length === 5 && lineSymbols.every(symbol => symbol.id === 'freespin')) {
        return {
          amount: 0,
          name: 'Бесплатные вращения!',
          lineType: 'horizontal',
          position: row,
          isFreeSpins: true,
          isFreeSpin: false
        };
      }
    }

    // Проверяем вертикальные линии на 3 совпадения
    for (let col = 0; col < 5; col++) {
      const lineSymbols = symbols[col];
      if (lineSymbols.length === 3 && lineSymbols.every(symbol => symbol.id === 'freespin')) {
        return {
          amount: 0,
          name: 'Бесплатные вращения!',
          lineType: 'vertical',
          position: col,
          isFreeSpins: true,
          isFreeSpin: false
        };
      }
    }

    // Проверяем диагональ слева направо на 5 совпадений
    const diagonalLR = [symbols[0][0], symbols[1][1], symbols[2][2], symbols[3][2], symbols[4][2]];
    if (diagonalLR.length === 5 && diagonalLR.every(symbol => symbol.id === 'freespin')) {
      return {
        amount: 0,
        name: 'Бесплатные вращения!',
        lineType: 'diagonal-lr',
        isFreeSpins: true,
        isFreeSpin: false
      };
    }

    // Проверяем диагональ справа налево на 5 совпадений
    const diagonalRL = [symbols[0][2], symbols[1][1], symbols[2][0], symbols[3][0], symbols[4][0]];
    if (diagonalRL.length === 5 && diagonalRL.every(symbol => symbol.id === 'freespin')) {
      return {
        amount: 0,
        name: 'Бесплатные вращения!',
        lineType: 'diagonal-rl',
        isFreeSpins: true,
        isFreeSpin: false
      };
    }

    return null;
  };

  const checkFourMatch = (symbols: Symbol[][]): { hasMatch: boolean; rows: number[]; matchPosition: 'left' | 'right' } => {
    const matchedRows: number[] = [];
    let matchPosition: 'left' | 'right' = 'left';
    
    // Проверяем все три горизонтальные линии
    for (let row = 0; row < 3; row++) {
      // Проверяем первые четыре барабана
      const firstFour = symbols.slice(0, 4).map(reel => reel[row]);
      if (firstFour[0].id === firstFour[1].id && 
          firstFour[1].id === firstFour[2].id && 
          firstFour[2].id === firstFour[3].id) {
        matchedRows.push(row);
        matchPosition = 'left';
        continue;
      }
      
      // Проверяем последние четыре барабана
      const lastFour = symbols.slice(1, 5).map(reel => reel[row]);
      if (lastFour[0].id === lastFour[1].id && 
          lastFour[1].id === lastFour[2].id && 
          lastFour[2].id === lastFour[3].id) {
        matchedRows.push(row);
        matchPosition = 'right';
      }
    }
    
    return {
      hasMatch: matchedRows.length > 0,
      rows: matchedRows,
      matchPosition
    };
  };

  const spinLastReel = async () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setLastWin(null);

    // Определяем, какой барабан крутить в зависимости от позиции совпадения
    const reelToSpin = matchPosition === 'left' ? 4 : 0;
    const newReelSymbols = getRandomSymbols(slotConfig.symbols.length);
    
    // Обновляем нужный барабан
    const updatedReels = [...reels];
    updatedReels[reelToSpin] = [...reels[reelToSpin], ...newReelSymbols];
    setReels(updatedReels);

    await new Promise(resolve => 
      setTimeout(resolve, slotConfig.animation.duration)
    );

    const finalSymbols = reels.map((reel, index) => {
      if (index === reelToSpin) {
        return updatedReels[reelToSpin].slice(-slotConfig.symbols.length);
      }
      return reel;
    });
    
    setReels(finalSymbols);

    // Сначала проверяем фри спины
    const freeSpinsResult = checkFreeSpins(finalSymbols);
    if (freeSpinsResult) {
      setLastWin(freeSpinsResult);
      setFreeSpins(slotConfig.gameSettings.freeSpins.count);
      setHasFourMatch(false);
      setMatchedRows([]);
      setIsSpinning(false);
      return;
    }

    // Проверяем на 4 совпадения для каждой строки с предыдущими тремя совпадениями
    let totalWinAmount = 0;
    const wins: string[] = [];
    let winningRow = -1;

    // Проверяем на выигрыш через checkCenterMatch
    const centerMatchResult = checkCenterMatch(finalSymbols);
    if (centerMatchResult) {
      updateBalance(centerMatchResult.amount);
      setLastWin(centerMatchResult);
      setHasFourMatch(false);
      setMatchedRows([]);
      setIsSpinning(false);
      return;
    }

    for (const row of matchedRows) {
      const lineSymbols = finalSymbols.map(reel => reel[row]);
      const firstSymbol = lineSymbols[0];
      
      // Проверяем, все ли символы в линии одинаковые
      if (lineSymbols.every(symbol => symbol.id === firstSymbol.id)) {
        const payline = slotConfig.paylines.find(p => 
          p.combination.every(id => id === firstSymbol.id)
        );
        
        if (payline) {
          // Применяем множитель фри спинов к выигрышу
          const baseWinAmount = bet * payline.multiplier;
          const winAmount = isFreeSpin ? baseWinAmount * multiplier : baseWinAmount;
          
          totalWinAmount += winAmount;
          wins.push(`${payline.name}${isFreeSpin ? ` (x${multiplier})` : ''}`);
          winningRow = row;
          
          if (payline.isJackpot) {
            useGameStore.getState().resetJackpot();
          }
        }
      }
    }

    if (totalWinAmount > 0) {
      updateBalance(totalWinAmount);
      setLastWin({
        amount: totalWinAmount,
        name: wins.join('\n'),
        lineType: 'horizontal',
        position: winningRow,
        isFreeSpin
      });
    }

    if (isFreeSpin) {
      decrementFreeSpins();
    }

    setHasFourMatch(false);
    setMatchedRows([]);
    setIsSpinning(false);
  };

  const spin = async () => {
    if (isSpinning) return;
    if (!isFreeSpin && balance < bet) return;

    // Если есть четыре совпадения, крутим нужный барабан
    if (hasFourMatch) {
      await spinLastReel();
      return;
    }
    
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

    // Если нет 5 совпадений, проверяем на 4 совпадения
    const fourMatchResult = checkFourMatch(finalSymbols);
    if (fourMatchResult.hasMatch) {
      setHasFourMatch(true);
      setMatchedRows(fourMatchResult.rows);
      setMatchPosition(fourMatchResult.matchPosition);
      
      const rowDescriptions = fourMatchResult.rows.map(row => {
        const position = row === 0 ? "верхней" : row === 1 ? "центральной" : "нижней";
        const symbol = finalSymbols[fourMatchResult.matchPosition === 'left' ? 0 : 1][row].symbol;
        return `${symbol} на ${position} линии`;
      });

      setLastWin({
        amount: 0,
        name: `Найдены 4 совпадения!\n${rowDescriptions.join('\n')}\nКрутите ${fourMatchResult.matchPosition === 'left' ? 'пятый' : 'первый'} барабан для улучшения выигрыша!`,
        isConsolation: true,
        lineType: 'horizontal',
        hasFourMatch: true,
        matchedRows: fourMatchResult.rows,
        isFreeSpin: false
      });
      setIsSpinning(false);
      return;
    }

    if (isFreeSpin) {
      decrementFreeSpins();
    }
    
    setIsSpinning(false);
  };

  return (
    <>
      <style jsx>{`
        @keyframes win-message {
          0% {
            transform: translate(-50%, -20px);
            opacity: 0;
          }
          20% {
            transform: translate(-50%, 0);
            opacity: 1;
          }
          80% {
            transform: translate(-50%, 0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -20px);
            opacity: 0;
          }
        }

        .win-message {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 50;
          width: 100%;
          max-width: 600px;
          animation: win-message 3s ease-in-out;
        }

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
        .reel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 28px;
          background: linear-gradient(to bottom, rgba(0,0,0,0.32), rgba(0,0,0,0));
          z-index: 2;
          pointer-events: none;
        }
        .reel::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 28px;
          background: linear-gradient(to top, rgba(0,0,0,0.32), rgba(0,0,0,0));
          z-index: 2;
          pointer-events: none;
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

        .matched-four {
          background: rgba(255, 215, 0, 0.3);
          border: 2px solid gold;
        }

        .modal-bg {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-content {
          background: #fff;
          border-radius: 1rem;
          max-width: 420px;
          width: 100%;
          padding: 2rem 1.5rem 1.5rem 1.5rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.25);
          position: relative;
        }
        .modal-content h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }
        .modal-content ul {
          margin-left: 1.2em;
          margin-bottom: 1em;
        }
        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #333;
          cursor: pointer;
        }
      `}</style>

      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-900 to-purple-600 p-8">
        {lastWin && (
          <div className="win-message">
            <div className={`p-4 rounded-lg shadow-lg ${lastWin.isConsolation ? 'bg-yellow-600' : 'bg-green-600'}`}>
              <div className="text-2xl font-bold text-white text-center">
                {lastWin.name}
              </div>
              <div className="text-xl text-yellow-300 text-center mt-1">
                Выигрыш: {lastWin.amount.toLocaleString('ru-RU')} ₽
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-w-4xl mx-auto flex gap-4 mb-8">
          <div className="flex-grow">
            <div className="bg-yellow-900 p-8 rounded-xl shadow-2xl relative">
              <div className="flex justify-center mb-4">
                <Jackpot />
              </div>
              <div className="flex gap-4 mb-8 p-4 bg-yellow-800 rounded-lg justify-center">
                {reels.map((reel, reelIndex) => (
                  <div 
                    key={reelIndex} 
                    className={`reel ${hasFourMatch && (
                      (matchPosition === 'left' && reelIndex < 4) || 
                      (matchPosition === 'right' && reelIndex > 0)
                    ) ? 'matched-four' : ''}`}
                  >
                    <div 
                      className={`symbols-container ${
                        isSpinning && (!hasFourMatch || (
                          (matchPosition === 'left' && reelIndex === 4) ||
                          (matchPosition === 'right' && reelIndex === 0)
                        )) ? 'spinning' : ''
                      }`} 
                      style={{
                        animationDelay: `${reelIndex * slotConfig.animation.delayBetweenReels}ms`
                      }}
                    >
                      {reel.map((symbol, symbolIndex) => (
                        <div
                          key={`${reelIndex}-${symbolIndex}`}
                          className={`w-20 h-24 flex items-center justify-center text-5xl shrink-0 
                            ${!isSpinning && lastWin && !lastWin.isConsolation && symbolIndex === (lastWin.position ?? 1) ? 'win-animation' : ''}
                            ${hasFourMatch && matchedRows.includes(symbolIndex) ? 'matched-row' : ''}
                            ${!isSpinning && lastWin && lastWin.isConsolation ? 
                              (lastWin.lineType === 'horizontal' && lastWin.matchedRows?.includes(symbolIndex)) ||
                              (lastWin.lineType === 'diagonal-lr' && ((reelIndex === 0 && symbolIndex === 0) || 
                                                                     (reelIndex === 1 && symbolIndex === 1) || 
                                                                     (reelIndex === 2 && symbolIndex === 2) ||
                                                                     (reelIndex === 3 && symbolIndex === 2))) ||
                              (lastWin.lineType === 'diagonal-rl' && ((reelIndex === 0 && symbolIndex === 2) || 
                                                                     (reelIndex === 1 && symbolIndex === 1) || 
                                                                     (reelIndex === 2 && symbolIndex === 0) ||
                                                                     (reelIndex === 3 && symbolIndex === 0)))
                              ? 'consolation win-animation' : '' : ''}`}
                        >
                          {symbol.symbol}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={hasFourMatch ? spinLastReel : spin}
                disabled={isSpinning || (!hasFourMatch && balance < bet)}
                className={`w-full py-4 px-8 text-xl font-bold rounded-lg transition-all ${
                  isSpinning || (!hasFourMatch && balance < bet)
                    ? 'bg-gray-500 cursor-not-allowed'
                    : hasFourMatch
                    ? 'bg-yellow-400 hover:bg-yellow-500 active:transform active:scale-95'
                    : 'bg-yellow-500 hover:bg-yellow-600 active:transform active:scale-95'
                }`}
              >
                {isSpinning 
                  ? 'Вращается...' 
                  : hasFourMatch 
                  ? 'Крутить пятый барабан!' 
                  : balance < bet 
                  ? 'Недостаточно средств' 
                  : 'Крутить!'}
              </button>

              <button
                onClick={activateFreeSpins}
                disabled={isSpinning || freeSpinsCount > 0}
                className={`w-full mt-4 py-3 px-6 text-lg font-bold rounded-lg transition-all ${
                  isSpinning || freeSpinsCount > 0
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-purple-500 hover:bg-purple-600 active:transform active:scale-95'
                }`}
              >
                {freeSpinsCount > 0 
                  ? `Активны фри спины (${freeSpinsCount})` 
                  : 'Активировать фри спины'}
              </button>

              <div className="flex gap-6 justify-center mt-8">
                <Bet />
                <Balance />
                <button
                  className="py-3 px-6 text-lg font-bold rounded-lg bg-purple-700 hover:bg-purple-800 text-white transition-all"
                  onClick={() => setShowRules(true)}
                >
                  Правила
                </button>
                {(freeSpinsCount > 0 || isFreeSpin) && <FreeSpins />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно с правилами */}
      {showRules && (
        <div className="modal-bg" onClick={() => setShowRules(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRules(false)}>&times;</button>
            <h2>Правила игры</h2>
            <ul>
              <li>Выберите ставку и нажмите "Крутить!".</li>
              <li>Выпадение 5 одинаковых символов на линии — максимальный выигрыш.</li>
              <li>4 одинаковых символа подряд — шанс докрутить 5-й барабан.</li>
              <li>Выпадение 5 символов ⭐ на линии — бесплатные вращения.</li>
              <li>Джекпот — 5 семёрок на линии.</li>
              <li>Баланс не может уйти в минус.</li>
            </ul>
            <div className="text-sm text-gray-500">Удачи!</div>
          </div>
        </div>
      )}
    </>
  );
} 