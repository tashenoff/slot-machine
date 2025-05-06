'use client';

import { useGameStore } from '../store/gameStore';

export default function Jackpot() {
  const { jackpot } = useGameStore();

  return (
    <div className="bg-purple-900 p-4 rounded-lg text-white text-center">
      <div className="text-lg font-bold mb-1">Джекпот</div>
      <div className="text-3xl font-bold text-yellow-400 animate-pulse">
        {jackpot.toLocaleString('ru-RU')} ₽
      </div>
    </div>
  );
} 