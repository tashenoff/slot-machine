import { create } from 'zustand';
import { StateCreator } from 'zustand';
import slotConfig from '../config/slot-machine.json';

interface GameState {
  balance: number;
  bet: number;
  jackpot: number;
  freeSpinsCount: number;
  isFreeSpin: boolean;
  multiplier: number;
  setBet: (amount: number) => void;
  updateBalance: (amount: number) => void;
  increaseJackpot: (amount: number) => void;
  resetJackpot: () => void;
  getJackpot: () => number;
  setFreeSpins: (count: number) => void;
  decrementFreeSpins: () => void;
  setMultiplier: (value: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  balance: slotConfig.gameSettings.initialBalance,
  bet: slotConfig.gameSettings.bets.min,
  jackpot: slotConfig.gameSettings.initialJackpot,
  freeSpinsCount: 0,
  isFreeSpin: false,
  multiplier: 1,

  setBet: (amount: number) => 
    set((state: GameState) => {
      if (amount <= state.balance) {
        return { bet: amount };
      }
      return state;
    }),

  updateBalance: (amount: number) =>
    set((state: GameState) => ({
      balance: state.balance + amount,
    })),

  increaseJackpot: (amount: number) =>
    set((state: GameState) => ({
      jackpot: state.jackpot + amount,
    })),

  resetJackpot: () =>
    set(() => ({
      jackpot: slotConfig.gameSettings.initialJackpot,
    })),

  getJackpot: () => get().jackpot,

  setFreeSpins: (count: number) =>
    set(() => ({
      freeSpinsCount: count,
      isFreeSpin: count > 0,
      multiplier: count > 0 ? slotConfig.gameSettings.freeSpins.multiplier : 1
    })),

  decrementFreeSpins: () =>
    set((state: GameState) => {
      const newCount = Math.max(0, state.freeSpinsCount - 1);
      return {
        freeSpinsCount: newCount,
        isFreeSpin: newCount > 0,
        multiplier: newCount > 0 ? state.multiplier : 1
      };
    }),

  setMultiplier: (value: number) =>
    set(() => ({
      multiplier: value
    })),
})); 