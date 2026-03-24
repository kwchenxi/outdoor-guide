import { trailService } from './trailService';
import { userService } from './userService';
import { TrailData } from '../types';

export const migrationService = {
  async migrateFromLocalStorage(): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    try {
      const userId = userService.getCurrentUserId();

      const migratedKeys = new Set<string>(JSON.parse(localStorage.getItem('instant_migrated_keys') || '[]'));

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        if (key.startsWith('ecotrek_community_') && !migratedKeys.has(key)) {
          try {
            const json = localStorage.getItem(key);
            if (!json) continue;

            const trailData: TrailData = JSON.parse(json);

            if (!trailData.name) {
              results.errors.push(`跳过无效数据: ${key}`);
              results.failed++;
              continue;
            }

            await trailService.createTrail(trailData, userId);

            migratedKeys.add(key);
            results.success++;

            console.log(`成功迁移: ${trailData.name}`);
          } catch (error) {
            console.error(`迁移失败: ${key}`, error);
            results.errors.push(`${key}: ${error}`);
            results.failed++;
          }
        }
      }

      localStorage.setItem('instant_migrated_keys', JSON.stringify([...migratedKeys]));

      const savedPlans = localStorage.getItem('ecotrek_my_plans');
      if (savedPlans) {
        try {
          const savedTrails: TrailData[] = JSON.parse(savedPlans);
          for (const trail of savedTrails) {
            if (!migratedKeys.has(`saved_${trail.name}`)) {
              try {
                await trailService.createTrail(trail, userId);
                migratedKeys.add(`saved_${trail.name}`);
                results.success++;
                console.log(`成功迁移保存的路线: ${trail.name}`);
              } catch (error) {
                console.error(`迁移保存的路线失败: ${trail.name}`, error);
                results.errors.push(`保存的路线 ${trail.name}: ${error}`);
                results.failed++;
              }
            }
          }
          localStorage.setItem('instant_migrated_keys', JSON.stringify([...migratedKeys]));
        } catch (error) {
          console.error('迁移保存的路线失败', error);
          results.errors.push(`保存的路线: ${error}`);
          results.failed++;
        }
      }

    } catch (error) {
      console.error('迁移过程中发生错误', error);
      results.errors.push(`总体错误: ${error}`);
    }

    return results;
  },

  async clearLocalStorageAfterMigration(): Promise<void> {
    const migratedKeys = new Set<string>(JSON.parse(localStorage.getItem('instant_migrated_keys') || '[]'));

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key.startsWith('ecotrek_') && migratedKeys.has(key)) {
        localStorage.removeItem(key);
        console.log(`已清理: ${key}`);
      }
    }

    localStorage.removeItem('instant_migrated_keys');
    console.log('迁移完成，localStorage 已清理');
  },

  getMigrationStatus(): { total: number; migrated: number; remaining: number } {
    const migratedKeys = new Set<string>(JSON.parse(localStorage.getItem('instant_migrated_keys') || '[]'));

    let total = 0;
    let remaining = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key.startsWith('ecotrek_')) {
        total++;
        if (!migratedKeys.has(key)) {
          remaining++;
        }
      }
    }

    return {
      total,
      migrated: migratedKeys.size,
      remaining,
    };
  },
};
