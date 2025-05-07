'use client';

import { useGameStore } from '../store/gameStore';

export default function Balance() {
  const { balance } = useGameStore();

  return (
    <div className="bg-yellow-800 p-4 rounded-lg text-white">
      <div className="text-lg font-bold mb-1">Баланс</div>
      <div className="text-2xl font-bold text-yellow-400">
        {balance.toLocaleString('ru-RU')} ₽
      </div>
    </div>
  );
} 