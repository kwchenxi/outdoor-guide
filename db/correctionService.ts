import { db } from './config';
import { tx, id } from '@instantdb/react';

export interface Correction {
  id: string;
  trailId: string;
  userId?: string;
  field: string;
  oldValue: string;
  newValue: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export const correctionService = {
  async submitCorrection(
    trailId: string,
    userId: string,
    field: string,
    oldValue: string,
    newValue: string
  ): Promise<string> {
    const correctionId = id();
    await db.transact([
      tx.corrections[correctionId].create({
        id: correctionId,
        trailId,
        userId,
        field,
        oldValue,
        newValue,
        status: 'pending',
        createdAt: new Date(),
      }),
    ]);

    return correctionId;
  },

  async getCorrectionsForTrail(trailId: string): Promise<Correction[]> {
    const result = await db.queryOnce({
      corrections: {
        $: {
          where: { trailId },
          orderBy: { createdAt: 'desc' },
        },
        users: {
          $: {},
        },
      },
    });

    return result.corrections.map((c: any) => ({
      id: c.id,
      trailId: c.trailId,
      userId: c.userId,
      field: c.field,
      oldValue: c.oldValue,
      newValue: c.newValue,
      status: c.status,
      createdAt: c.createdAt,
      userName: c.users?.[0]?.name || '匿名用户',
    }));
  },

  async getUserCorrections(userId: string): Promise<Correction[]> {
    const result = await db.queryOnce({
      corrections: {
        $: {
          where: { userId },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return result.corrections;
  },

  async approveCorrection(correctionId: string) {
    await db.transact([
      tx.corrections[correctionId].update({ status: 'approved' }),
    ]);
  },

  async rejectCorrection(correctionId: string) {
    await db.transact([
      tx.corrections[correctionId].update({ status: 'rejected' }),
    ]);
  },

  async getPendingCorrections(): Promise<Correction[]> {
    const result = await db.queryOnce({
      corrections: {
        $: {
          where: { status: 'pending' },
          orderBy: { createdAt: 'desc' },
        },
        users: {
          $: {},
        },
      },
    });

    return result.corrections.map((c: any) => ({
      id: c.id,
      trailId: c.trailId,
      userId: c.userId,
      field: c.field,
      oldValue: c.oldValue,
      newValue: c.newValue,
      status: c.status,
      createdAt: c.createdAt,
      userName: c.users?.[0]?.name || '匿名用户',
    }));
  },

  async applyCorrectionToTrail(trailId: string, field: string, newValue: string) {
    const { trailService } = await import('./trailService');
    const trail = await trailService.getTrail(trailId);

    if (!trail) {
      throw new Error('Trail not found');
    }

    const updates: any = {};
    updates[field] = newValue;

    await trailService.updateTrail(trailId, updates);
  },
};
