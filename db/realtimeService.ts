import { db } from './config';
import { TrailData } from '../types';

export const realtimeService = {
  async getTrails(): Promise<TrailData[]> {
    const { trailService } = await import('./trailService');
    return await trailService.getAllTrails();
  },

  async getUserFavorites(userId: string): Promise<TrailData[]> {
    const { userService } = await import('./userService');
    return await userService.getFavorites(userId);
  },

  async getCorrections(): Promise<any[]> {
    const { correctionService } = await import('./correctionService');
    return await correctionService.getPendingCorrections();
  },
};
