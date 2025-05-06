import { create } from 'zustand';
import { StateCreator } from 'zustand';
import slotConfig from '../config/slot-machine.json';

interface GameState {
  balance: number;
  bet: number;
  jackpot: number;
  setBet: (amount: number) => void;
  updateBalance: (amount: number) => void;
  increaseJackpot: (amount: number) => void;
  resetJackpot: () => void;
  getJackpot: () => number;
}

export const useGameStore = create<GameState>((set, get) => ({
  balance: slotConfig.gameSettings.initialBalance,
  bet: slotConfig.gameSettings.bets.min,
  jackpot: slotConfig.gameSettings.initialJackpot,

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
})); 