import { init, i } from '@instantdb/react';

const APP_ID = '74a1e87c-3632-43a5-9a6b-24a9d8d2532a';

const schema = i.schema({
  trails: {
    primaryKey: 'id',
    fields: {
      id: i.string(),
      name: i.string(),
      location: i.string(),
      highlight: i.string(),
      difficulty: i.number(),
      duration: i.string(),
      length: i.string(),
      elevationGain: i.string(),
      centerCoordinates: i.any(),
      description: i.any(),
      story: i.any(),
      safetyTips: i.any(),
      bestSeason: i.any(),
      communityTips: i.any(),
      createdAt: i.date(),
      updatedAt: i.date(),
      createdBy: i.any(),
    },
  },
  routeSegments: {
    primaryKey: 'id',
    fields: {
      id: i.string(),
      trailId: i.string(),
      name: i.string(),
      distance: i.string(),
      time: i.string(),
      description: i.string(),
      landmarks: i.string(),
      isCommunityContributed: i.boolean(),
      createdAt: i.date(),
    },
  },
  routeNodes: {
    primaryKey: 'id',
    fields: {
      id: i.string(),
      segmentId: i.string(),
      name: i.string(),
      type: i.string(),
      coordinates: i.any(),
      distance: i.any(),
      time: i.any(),
      description: i.any(),
      highlights: i.any(),
      image: i.any(),
      order: i.number(),
    },
  },
  gear: {
    primaryKey: 'id',
    fields: {
      id: i.string(),
      trailId: i.string(),
      item: i.string(),
      reason: i.any(),
      type: i.string(),
    },
  },
  users: {
    primaryKey: 'id',
    fields: {
      id: i.string(),
      name: i.string(),
      email: i.any(),
      createdAt: i.date(),
    },
  },
  favorites: {
    primaryKey: 'id',
    fields: {
      id: i.string(),
      userId: i.string(),
      trailId: i.string(),
      createdAt: i.date(),
    },
  },
  corrections: {
    primaryKey: 'id',
    fields: {
      id: i.string(),
      trailId: i.string(),
      userId: i.any(),
      field: i.string(),
      oldValue: i.string(),
      newValue: i.string(),
      status: i.string(),
      createdAt: i.date(),
    },
  },
});

export const db = init({
  appId: APP_ID,
  schema,
});

export type InstantDB = typeof db;
