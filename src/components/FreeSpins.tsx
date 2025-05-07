'use client';

import { useGameStore } from '../store/gameStore';

export default function FreeSpins() {
  const { freeSpinsCount, isFreeSpin, multiplier } = useGameStore();

  if (!freeSpinsCount && !isFreeSpin) return null;

  return (
    <div className="bg-yellow-600 p-4 rounded-lg text-white text-center animate-pulse">
      <div className="text-lg font-bold mb-1">
        {isFreeSpin ? 'Бесплатное вращение' : 'Бесплатные вращения'}
      </div>
      <div className="text-3xl font-bold text-yellow-300">
        {freeSpinsCount} {freeSpinsCount === 1 ? 'спин' : 'спинов'}
      </div>
      <div className="text-sm mt-1">
        Множитель выигрыша: x{multiplier}
      </div>
    </div>
  );
} 