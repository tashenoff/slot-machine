'use client';

import { useGameStore } from '../store/gameStore';
import slotConfig from '../config/slot-machine.json';

export default function Bet() {
  const { bet, setBet } = useGameStore();
  const betSteps = slotConfig.gameSettings.bets.steps;

  return (
    <div className="bg-yellow-800 p-4 rounded-lg text-white">
      <div className="text-lg font-bold mb-2">Ставка</div>
      <div className="flex gap-2 flex-wrap">
        {betSteps.map((amount) => (
          <button
            key={amount}
            onClick={() => setBet(amount)}
            className={`px-4 py-2 rounded ${
              bet === amount
                ? 'bg-yellow-500 text-white'
                : 'bg-yellow-700 hover:bg-yellow-600'
            }`}
          >
            {amount.toLocaleString('ru-RU')}
          </button>
        ))}
      </div>
      <div className="mt-2 text-xl font-bold text-yellow-400">
        Текущая ставка: {bet.toLocaleString('ru-RU')} ₽
      </div>
    </div>
  );
} 