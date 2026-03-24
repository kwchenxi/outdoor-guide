import { db } from './config';
import { TrailData, RouteSegment, RouteNode, GearItem } from '../types';
import { tx, id } from '@instantdb/react';

export const trailService = {
  async createTrail(trailData: Partial<TrailData>, userId?: string) {
    const now = new Date();
    const trailId = id();

    const trail = {
      id: trailId,
      name: trailData.name || '',
      location: trailData.location || '',
      highlight: trailData.highlight || '',
      difficulty: trailData.difficulty || 3,
      duration: trailData.duration || '',
      length: trailData.length || '',
      elevationGain: trailData.elevationGain || '',
      centerCoordinates: trailData.centerCoordinates || null,
      description: trailData.description || null,
      story: trailData.story || null,
      safetyTips: trailData.safetyTips || [],
      bestSeason: trailData.bestSeason || null,
      communityTips: trailData.communityTips || [],
      createdAt: now,
      updatedAt: now,
      createdBy: userId || null,
    };

    await db.transact([
      tx.trails[trailId].create(trail),
    ]);

    if (trailData.routeSegments && trailData.routeSegments.length > 0) {
      for (const segment of trailData.routeSegments) {
        const segmentId = id();
        await db.transact([
          tx.routeSegments[segmentId].create({
            id: segmentId,
            trailId: trailId,
            name: segment.name,
            distance: segment.distance,
            time: segment.time,
            description: segment.description,
            landmarks: segment.landmarks,
            isCommunityContributed: segment.name.includes('旅友') || false,
            createdAt: now,
          }),
        ]);

        if (segment.timeline && segment.timeline.length > 0) {
          for (const node of segment.timeline) {
            const nodeId = id();
            await db.transact([
              tx.routeNodes[nodeId].create({
                id: nodeId,
                segmentId: segmentId,
                name: node.name,
                type: node.type || 'point',
                coordinates: node.coordinates || null,
                distance: node.distance || null,
                time: node.time || null,
                description: node.description || null,
                highlights: node.highlights || null,
                image: node.image || null,
                order: segment.timeline.indexOf(node),
              }),
            ]);
          }
        }
      }
    }

    if (trailData.gear) {
      if (trailData.gear.essential && trailData.gear.essential.length > 0) {
        for (const item of trailData.gear.essential) {
          const gearId = id();
          await db.transact([
            tx.gear[gearId].create({
              id: gearId,
              trailId: trailId,
              item: item.item,
              reason: item.reason || null,
              type: 'essential',
            }),
          ]);
        }
      }
      if (trailData.gear.recommended && trailData.gear.recommended.length > 0) {
        for (const item of trailData.gear.recommended) {
          const gearId = id();
          await db.transact([
            tx.gear[gearId].create({
              id: gearId,
              trailId: trailId,
              item: item.item,
              reason: item.reason || null,
              type: 'recommended',
            }),
          ]);
        }
      }
    }

    return trailId;
  },

  async getTrail(trailId: string): Promise<TrailData | null> {
    const trail = await db.queryOnce({
      trails: {
        $: { where: { id: trailId } },
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
    });

    if (!trail || trail.trails.length === 0) {
      return null;
    }

    const trailData = trail.trails[0];
    return this.convertToTrailData(trailData);
  },

  async getAllTrails(): Promise<TrailData[]> {
    const result = await db.queryOnce({
      trails: {
        $: { orderBy: { createdAt: 'desc' } },
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
    });

    return result.trails.map(t => this.convertToTrailData(t));
  },

  async searchTrails(query: string): Promise<TrailData[]> {
    const allTrails = await this.getAllTrails();
    const lowerQuery = query.toLowerCase();

    return allTrails.filter(trail =>
      trail.name.toLowerCase().includes(lowerQuery) ||
      trail.location.toLowerCase().includes(lowerQuery) ||
      trail.highlight.toLowerCase().includes(lowerQuery)
    );
  },

  async updateTrail(trailId: string, updates: Partial<TrailData>) {
    const now = new Date();

    const trailUpdate: any = {
      updatedAt: now,
    };

    if (updates.name !== undefined) trailUpdate.name = updates.name;
    if (updates.location !== undefined) trailUpdate.location = updates.location;
    if (updates.highlight !== undefined) trailUpdate.highlight = updates.highlight;
    if (updates.difficulty !== undefined) trailUpdate.difficulty = updates.difficulty;
    if (updates.duration !== undefined) trailUpdate.duration = updates.duration;
    if (updates.length !== undefined) trailUpdate.length = updates.length;
    if (updates.elevationGain !== undefined) trailUpdate.elevationGain = updates.elevationGain;
    if (updates.centerCoordinates !== undefined) trailUpdate.centerCoordinates = updates.centerCoordinates;
    if (updates.description !== undefined) trailUpdate.description = updates.description;
    if (updates.story !== undefined) trailUpdate.story = updates.story;
    if (updates.safetyTips !== undefined) trailUpdate.safetyTips = updates.safetyTips;
    if (updates.bestSeason !== undefined) trailUpdate.bestSeason = updates.bestSeason;
    if (updates.communityTips !== undefined) trailUpdate.communityTips = updates.communityTips;

    await db.transact([
      tx.trails[trailId].update(trailUpdate),
    ]);

    if (updates.routeSegments) {
      const existingSegments = await db.queryOnce({
        routeSegments: {
          $: { where: { trailId } },
        },
      });

      for (const existingSeg of existingSegments.routeSegments) {
        await db.transact([
          tx.routeSegments[existingSeg.id].delete(),
        ]);
      }

      for (const segment of updates.routeSegments) {
        const segmentId = id();
        await db.transact([
          tx.routeSegments[segmentId].create({
            id: segmentId,
            trailId: trailId,
            name: segment.name,
            distance: segment.distance,
            time: segment.time,
            description: segment.description,
            landmarks: segment.landmarks,
            isCommunityContributed: segment.name.includes('旅友') || false,
            createdAt: now,
          }),
        ]);

        if (segment.timeline && segment.timeline.length > 0) {
          for (const node of segment.timeline) {
            const nodeId = id();
            await db.transact([
              tx.routeNodes[nodeId].create({
                id: nodeId,
                segmentId: segmentId,
                name: node.name,
                type: node.type || 'point',
                coordinates: node.coordinates || null,
                distance: node.distance || null,
                time: node.time || null,
                description: node.description || null,
                highlights: node.highlights || null,
                image: node.image || null,
                order: segment.timeline.indexOf(node),
              }),
            ]);
          }
        }
      }
    }

    if (updates.gear) {
      const existingGear = await db.queryOnce({
        gear: {
          $: { where: { trailId } },
        },
      });

      for (const existingItem of existingGear.gear) {
        await db.transact([
          tx.gear[existingItem.id].delete(),
        ]);
      }

      if (updates.gear.essential && updates.gear.essential.length > 0) {
        for (const item of updates.gear.essential) {
          const gearId = id();
          await db.transact([
            tx.gear[gearId].create({
              id: gearId,
              trailId: trailId,
              item: item.item,
              reason: item.reason || null,
              type: 'essential',
            }),
          ]);
        }
      }
      if (updates.gear.recommended && updates.gear.recommended.length > 0) {
        for (const item of updates.gear.recommended) {
          const gearId = id();
          await db.transact([
            tx.gear[gearId].create({
              id: gearId,
              trailId: trailId,
              item: item.item,
              reason: item.reason || null,
              type: 'recommended',
            }),
          ]);
        }
      }
    }
  },

  async deleteTrail(trailId: string) {
    const segments = await db.queryOnce({
      routeSegments: {
        $: { where: { trailId } },
      },
    });

    for (const segment of segments.routeSegments) {
      const nodes = await db.queryOnce({
        routeNodes: {
          $: { where: { segmentId: segment.id } },
        },
      });

      for (const node of nodes.routeNodes) {
        await db.transact([
          tx.routeNodes[node.id].delete(),
        ]);
      }

      await db.transact([
        tx.routeSegments[segment.id].delete(),
      ]);
    }

    const gear = await db.queryOnce({
      gear: {
        $: { where: { trailId } },
      },
    });

    for (const item of gear.gear) {
      await db.transact([
        tx.gear[item.id].delete(),
      ]);
    }

    await db.transact([
      tx.trails[trailId].delete(),
    ]);
  },

  convertToTrailData(dbTrail: any): TrailData {
    const routeSegments: RouteSegment[] = (dbTrail.routeSegments || []).map((seg: any) => ({
      name: seg.name,
      distance: seg.distance,
      time: seg.time,
      description: seg.description,
      landmarks: seg.landmarks,
      timeline: (seg.routeNodes || [])
        .sort((a: any, b: any) => a.order - b.order)
        .map((node: any) => ({
          name: node.name,
          type: node.type,
          coordinates: node.coordinates,
          distance: node.distance,
          time: node.time,
          description: node.description,
          highlights: node.highlights,
          image: node.image,
        })),
    }));

    const gearItems = dbTrail.gear || [];
    const essential: GearItem[] = gearItems
      .filter((g: any) => g.type === 'essential')
      .map((g: any) => ({ item: g.item, reason: g.reason }));
    const recommended: GearItem[] = gearItems
      .filter((g: any) => g.type === 'recommended')
      .map((g: any) => ({ item: g.item, reason: g.reason }));

    return {
      id: dbTrail.id,
      name: dbTrail.name,
      location: dbTrail.location,
      highlight: dbTrail.highlight,
      difficulty: dbTrail.difficulty,
      duration: dbTrail.duration,
      length: dbTrail.length,
      elevationGain: dbTrail.elevationGain,
      centerCoordinates: dbTrail.centerCoordinates,
      description: dbTrail.description,
      story: dbTrail.story,
      routeSegments,
      gear: {
        essential,
        recommended,
      },
      safetyTips: dbTrail.safetyTips || [],
      bestSeason: dbTrail.bestSeason,
      communityTips: dbTrail.communityTips || [],
    };
  },
};
