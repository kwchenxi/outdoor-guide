import { db } from './config';
import { TrailData } from '../types';
import { tx, id } from '@instantdb/react';

export const userService = {
  getCurrentUserId(): string {
    let userId = localStorage.getItem('instant_user_id');
    if (!userId) {
      userId = id();
      localStorage.setItem('instant_user_id', userId);
    }
    return userId;
  },

  async getCurrentUser() {
    const userId = this.getCurrentUserId();
    const result = await db.queryOnce({
      users: {
        $: { where: { id: userId } },
      },
    });

    if (result.users.length === 0) {
      const newUser = {
        id: userId,
        name: `用户_${userId.substring(0, 8)}`,
        email: null,
        createdAt: new Date(),
      };
      await db.transact([
        tx.users[userId].create(newUser),
      ]);
      return newUser;
    }

    return result.users[0];
  },

  async updateUserName(userId: string, name: string) {
    await db.transact([
      tx.users[userId].update({ name }),
    ]);
  },

  async addFavorite(userId: string, trailId: string) {
    const existing = await db.queryOnce({
      favorites: {
        $: {
          where: {
            userId,
            trailId,
          },
        },
      },
    });

    if (existing.favorites.length > 0) {
      return;
    }

    const favoriteId = id();
    await db.transact([
      tx.favorites[favoriteId].create({
        id: favoriteId,
        userId,
        trailId,
        createdAt: new Date(),
      }),
    ]);
  },

  async removeFavorite(userId: string, trailId: string) {
    const existing = await db.queryOnce({
      favorites: {
        $: {
          where: {
            userId,
            trailId,
          },
        },
      },
    });

    for (const favorite of existing.favorites) {
      await db.transact([
        tx.favorites[favorite.id].delete(),
      ]);
    }
  },

  async isFavorite(userId: string, trailId: string): Promise<boolean> {
    const result = await db.queryOnce({
      favorites: {
        $: {
          where: {
            userId,
            trailId,
          },
        },
      },
    });

    return result.favorites.length > 0;
  },

  async getFavorites(userId: string): Promise<TrailData[]> {
    const result = await db.queryOnce({
      favorites: {
        $: {
          where: { userId },
          orderBy: { createdAt: 'desc' },
        },
        trails: {
          $: {},
          routeSegments: {
            $: { orderBy: { createdAt: 'asc' } },
            routeNodes: {
              $: { orderBy: { order: 'asc' } },
            },
          },
          gear: {
            $: {},
          },
        },
      },
    });

    const { trailService } = await import('./trailService');
    return result.favorites
      .map(fav => fav.trails[0])
      .filter(Boolean)
      .map(trail => trailService.convertToTrailData(trail));
  },

  async toggleFavorite(userId: string, trailId: string): Promise<boolean> {
    const isFav = await this.isFavorite(userId, trailId);
    if (isFav) {
      await this.removeFavorite(userId, trailId);
      return false;
    } else {
      await this.addFavorite(userId, trailId);
      return true;
    }
  },
};
