/**
 * @file Guild raid progress aggregation and analysis service
 * @module services/guildRaidProgress
 */

import { 
  getAllActiveMembers, 
  getSeasonRaidProgress, 
  getAllSeasonRaidProgress,
  saveSeasonRaidProgress,
  hasSeasonRaidProgress
} from '../database.js';
import { THE_WAR_WITHIN_SEASONS, getCurrentSeason, getSeasonInfo, mapBlizzardRaidToSeason } from '../config/seasons.js';
import config from '../../app.config.js';

const { GUILLD_RANKS, MAIN_RANKS, ALT_RANKS } = config;

/**
 * Analyzes individual character raid progress across all difficulties
 * @param {Object} raidData - Character's raid data from Battle.net API
 * @param {string} targetRaidName - Name of the raid to analyze
 * @returns {Object} Progress summary for the character
 */
function analyzeCharacterRaidProgress(raidData, targetRaidName) {
  if (!raidData?.instances) {
    return {
      found: false,
      difficulties: {}
    };
  }

  const raid = raidData.instances.find(instance => 
    instance.instance?.name === targetRaidName
  );

  if (!raid) {
    return {
      found: false,
      difficulties: {}
    };
  }

  const difficulties = {};
  
  raid.modes?.forEach(mode => {
    const difficultyName = mode.difficulty.name;
    const progress = mode.progress;
    
    difficulties[difficultyName] = {
      completed: progress?.completed_count || 0,
      total: progress?.total_count || 0,
      percentage: progress?.total_count > 0 ? 
        Math.round((progress.completed_count / progress.total_count) * 100) : 0,
      status: progress?.completed_count === progress?.total_count ? 'complete' : 'incomplete',
      encounters: progress?.encounters?.map(enc => ({
        name: enc.encounter.name,
        completed: !!enc.last_kill_timestamp,
        lastKill: enc.last_kill_timestamp || null
      })) || []
    };
  });

  return {
    found: true,
    difficulties
  };
}

/**
 * Aggregates guild-wide progress for a specific raid
 * @param {Object[]} members - Array of guild member data
 * @param {string} raidName - Name of the raid to analyze
 * @param {Object} raidConfig - Raid configuration from seasons.js
 * @returns {Object} Guild progress summary
 */
function aggregateGuildRaidProgress(members, raidName, raidConfig) {
  const guildProgress = {
    raidName,
    totalMembers: members.length,
    membersWithProgress: 0,
    difficulties: {},
    memberBreakdown: {
      mains: { total: 0, withProgress: 0 },
      alts: { total: 0, withProgress: 0 }
    }
  };

  // Initialize difficulty tracking
  raidConfig.difficulties.forEach(difficulty => {
    guildProgress.difficulties[difficulty] = {
      membersCompleted: 0,
      membersWithProgress: 0,
      averageProgress: 0,
      bossKills: {},
      topProgressors: []
    };

    // Initialize boss kill tracking
    raidConfig.bosses.forEach(boss => {
      guildProgress.difficulties[difficulty].bossKills[boss] = 0;
    });
  });

  members.forEach(member => {
    const isMain = MAIN_RANKS.includes(member.guildData?.rank);
    const isAlt = ALT_RANKS.includes(member.guildData?.rank);
    
    if (isMain) {
      guildProgress.memberBreakdown.mains.total++;
    } else if (isAlt) {
      guildProgress.memberBreakdown.alts.total++;
    }

    // Analyze current season raid data first, then fall back to all expansions
    const currentSeasonData = member.raidHistory?.currentSeason;
    const allExpansionsData = member.raidHistory?.allExpansions || [];
    
    let memberProgress = null;
    
    if (currentSeasonData?.instances) {
      memberProgress = analyzeCharacterRaidProgress(currentSeasonData, raidName);
    }
    
    // If not found in current season, search all expansions
    if (!memberProgress?.found && allExpansionsData.length > 0) {
      for (const expansion of allExpansionsData) {
        if (expansion.instances) {
          memberProgress = analyzeCharacterRaidProgress(expansion, raidName);
          if (memberProgress.found) break;
        }
      }
    }

    if (memberProgress?.found) {
      guildProgress.membersWithProgress++;
      
      if (isMain) {
        guildProgress.memberBreakdown.mains.withProgress++;
      } else if (isAlt) {
        guildProgress.memberBreakdown.alts.withProgress++;
      }

      // Process each difficulty
      Object.entries(memberProgress.difficulties).forEach(([difficulty, progress]) => {
        if (guildProgress.difficulties[difficulty]) {
          const diffData = guildProgress.difficulties[difficulty];
          
          if (progress.completed > 0) {
            diffData.membersWithProgress++;
          }
          
          if (progress.status === 'complete') {
            diffData.membersCompleted++;
          }

          // Track boss kills
          progress.encounters.forEach(encounter => {
            if (encounter.completed && diffData.bossKills[encounter.name] !== undefined) {
              diffData.bossKills[encounter.name]++;
            }
          });

          // Track top progressors
          diffData.topProgressors.push({
            name: member.name,
            server: member.server,
            completed: progress.completed,
            total: progress.total,
            percentage: progress.percentage,
            guildRank: GUILLD_RANKS[member.guildData?.rank] || 'Unknown',
            class: member.metaData?.class,
            spec: member.metaData?.spec
          });
        }
      });
    }
  });

  // Calculate averages and sort top progressors
  Object.keys(guildProgress.difficulties).forEach(difficulty => {
    const diffData = guildProgress.difficulties[difficulty];
    
    // Calculate average progress
    if (diffData.topProgressors.length > 0) {
      diffData.averageProgress = Math.round(
        diffData.topProgressors.reduce((sum, p) => sum + p.percentage, 0) / diffData.topProgressors.length
      );
    }
    
    // Sort and limit top progressors
    diffData.topProgressors = diffData.topProgressors
      .sort((a, b) => b.percentage - a.percentage || b.completed - a.completed)
      .slice(0, 10);
  });

  return guildProgress;
}

/**
 * Gets comprehensive guild raid progress for all seasons (cached version)
 * @param {boolean} forceCalculate - Force live calculation instead of using cache
 * @returns {Promise<Object>} Complete guild raid progress data
 */
export async function getGuildRaidProgressAllSeasonsCached(forceCalculate = false) {
  try {
    if (!forceCalculate) {
      // Try to get cached data first
      const cachedData = await getAllSeasonRaidProgress();
      
      if (cachedData.length > 0) {
        console.log('🏛️ Using cached raid progress data');
        
        // Transform cached data to match expected format
        const result = {
          totalMembers: cachedData[0]?.totalMembers || 0,
          lastUpdated: new Date().toISOString(),
          seasons: {},
          cached: true,
          cacheAge: cachedData.map(d => ({
            seasonId: d.seasonId,
            lastUpdated: d.lastUpdated
          }))
        };
        
        cachedData.forEach(seasonData => {
          result.seasons[seasonData.seasonId] = {
            id: seasonData.seasonId,
            name: seasonData.seasonName,
            raids: seasonData.raids,
            totalMembers: seasonData.totalMembers,
            lastUpdated: seasonData.lastUpdated
          };
        });
        
        return result;
      }
    }
    
    // Fall back to live calculation
    console.log('📊 Calculating raid progress live...');
    return await getGuildRaidProgressAllSeasons();
  } catch (error) {
    console.error('❌ Failed to get cached guild raid progress:', error);
    // Fall back to live calculation on error
    return await getGuildRaidProgressAllSeasons();
  }
}

/**
 * Gets comprehensive guild raid progress for all seasons (live calculation)
 * @returns {Promise<Object>} Complete guild raid progress data
 */
export async function getGuildRaidProgressAllSeasons() {
  try {
    const members = await getAllActiveMembers();
    if (!members.length) {
      throw new Error('No guild members found');
    }

    const result = {
      totalMembers: members.length,
      lastUpdated: new Date().toISOString(),
      seasons: {}
    };

    // Process each season
    Object.entries(THE_WAR_WITHIN_SEASONS).forEach(([seasonId, seasonConfig]) => {
      result.seasons[seasonId] = {
        ...seasonConfig,
        raids: seasonConfig.raids.map(raid => 
          aggregateGuildRaidProgress(members, raid.name, raid)
        )
      };
    });

    return result;
  } catch (error) {
    console.error('❌ Failed to get guild raid progress:', error);
    throw error;
  }
}

/**
 * Gets guild raid progress for a specific season (cached version)
 * @param {string} seasonId - Season identifier
 * @param {boolean} forceCalculate - Force live calculation instead of using cache
 * @returns {Promise<Object>} Season-specific guild raid progress
 */
export async function getGuildRaidProgressBySeasonCached(seasonId, forceCalculate = false) {
  try {
    if (!forceCalculate) {
      // Try to get cached data first
      const cachedData = await getSeasonRaidProgress(seasonId);
      
      if (cachedData) {
        console.log(`🏛️ Using cached raid progress data for ${seasonId}`);
        
        const seasonConfig = getSeasonInfo(seasonId);
        return {
          season: seasonConfig,
          totalMembers: cachedData.totalMembers,
          lastUpdated: cachedData.lastUpdated.toISOString(),
          raids: cachedData.raids,
          cached: true,
          cacheAge: cachedData.lastUpdated
        };
      }
    }
    
    // Fall back to live calculation
    console.log(`📊 Calculating raid progress live for ${seasonId}...`);
    return await getGuildRaidProgressBySeason(seasonId);
  } catch (error) {
    console.error(`❌ Failed to get cached guild raid progress for season ${seasonId}:`, error);
    // Fall back to live calculation on error
    return await getGuildRaidProgressBySeason(seasonId);
  }
}

/**
 * Gets guild raid progress for a specific season (live calculation)
 * @param {string} seasonId - Season identifier
 * @returns {Promise<Object>} Season-specific guild raid progress
 */
export async function getGuildRaidProgressBySeason(seasonId) {
  try {
    const seasonConfig = getSeasonInfo(seasonId);
    if (!seasonConfig) {
      throw new Error(`Season ${seasonId} not found`);
    }

    const members = await getAllActiveMembers();
    if (!members.length) {
      throw new Error('No guild members found');
    }

    const result = {
      season: seasonConfig,
      totalMembers: members.length,
      lastUpdated: new Date().toISOString(),
      raids: seasonConfig.raids.map(raid => 
        aggregateGuildRaidProgress(members, raid.name, raid)
      )
    };

    return result;
  } catch (error) {
    console.error(`❌ Failed to get guild raid progress for season ${seasonId}:`, error);
    throw error;
  }
}

/**
 * Gets guild progress for current season only
 * @returns {Promise<Object>} Current season guild raid progress
 */
export async function getCurrentSeasonGuildProgress() {
  const currentSeason = getCurrentSeason();
  return await getGuildRaidProgressBySeason(currentSeason.id);
}

/**
 * Gets simplified guild progress summary for home page display
 * @returns {Promise<Object>} Simplified progress data
 */
export async function getGuildProgressSummary() {
  try {
    const members = await getAllActiveMembers();
    const currentSeason = getCurrentSeason();
    
    if (!members.length) {
      return {
        error: 'No guild members found'
      };
    }

    const summary = {
      currentSeason: currentSeason.name,
      totalMembers: members.length,
      raids: []
    };

    // Get progress for current season raids
    for (const raid of currentSeason.raids) {
      const raidProgress = aggregateGuildRaidProgress(members, raid.name, raid);
      
      summary.raids.push({
        name: raid.name,
        heroicProgress: {
          completed: raidProgress.difficulties.Heroic?.membersCompleted || 0,
          total: members.length,
          percentage: Math.round(((raidProgress.difficulties.Heroic?.membersCompleted || 0) / members.length) * 100)
        },
        mythicProgress: {
          completed: raidProgress.difficulties.Mythic?.membersCompleted || 0,
          total: members.length,
          percentage: Math.round(((raidProgress.difficulties.Mythic?.membersCompleted || 0) / members.length) * 100)
        }
      });
    }

    return summary;
  } catch (error) {
    console.error('❌ Failed to get guild progress summary:', error);
    return {
      error: error.message
    };
  }
}