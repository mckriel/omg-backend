/**
 * @file Season and raid configuration for The War Within expansion
 * @module config/seasons
 */

export const THE_WAR_WITHIN_SEASONS = {
  'season-1': {
    id: 'season-1',
    name: 'Season 1',
    startDate: '2024-08-26', // Season 1 started with expansion launch
    endDate: '2025-01-07',   // Ended when Season 2 started
    raids: [
      {
        id: 'nerubar-palace',
        name: "Nerub-ar Palace",
        difficulties: ['LFR', 'Normal', 'Heroic', 'Mythic'],
        bossCount: 8,
        bosses: [
          'Ulgrax the Devourer',
          'The Bloodbound Horror', 
          'Sikran, Captain of the Sureki',
          'Rasha\'nan',
          'Broodtwister Ovi\'nax',
          'Nexus-Princess Ky\'veza',
          'The Silken Court',
          'Queen Ansurek'
        ]
      }
    ],
    dungeons: [
      'The Stonevault',
      'City of Threads',
      'Ara-Kara, City of Echoes',
      'The Dawnbreaker',
      'Priory of the Sacred Flame',
      'Cinderbrew Meadery',
      'Darkflame Cleft',
      'The Rookery'
    ]
  },
  'season-2': {
    id: 'season-2', 
    name: 'Season 2',
    startDate: '2025-01-07', // Season 2 started
    endDate: null,           // Currently active
    raids: [
      {
        id: 'liberation-of-undermine',
        name: "Liberation of Undermine",
        difficulties: ['LFR', 'Normal', 'Heroic', 'Mythic'],
        bossCount: 8,
        bosses: [
          'Ksvir the Forgotten',
          'Cogwork Demolisher', 
          'Kx\'tal the Mournful',
          'Koranos the Relentless',
          'Zeroketh the Infernal',
          'Skaadi the Ruthless',
          'Vexamus the Destroyer',
          'Anub\'azal the Traitor'
        ]
      }
    ],
    dungeons: [
      'The Stonevault',
      'City of Threads', 
      'Ara-Kara, City of Echoes',
      'The Dawnbreaker',
      'Grim Batol',
      'The Necrotic Wake',
      'Siege of Boralus',
      'Mists of Tirna Scithe'
    ]
  }
};

export const CURRENT_SEASON = 'season-2';

/**
 * Gets season information by season ID
 * @param {string} seasonId - The season identifier
 * @returns {Object|null} Season configuration or null if not found
 */
export function getSeasonInfo(seasonId) {
  return THE_WAR_WITHIN_SEASONS[seasonId] || null;
}

/**
 * Gets all available seasons
 * @returns {Object[]} Array of all season configurations
 */
export function getAllSeasons() {
  return Object.values(THE_WAR_WITHIN_SEASONS);
}

/**
 * Gets the current active season
 * @returns {Object} Current season configuration
 */
export function getCurrentSeason() {
  return THE_WAR_WITHIN_SEASONS[CURRENT_SEASON];
}

/**
 * Maps Battle.net raid names to our season configuration
 * @param {string} blizzardRaidName - Raid name from Battle.net API
 * @returns {Object|null} Season and raid info or null if not found
 */
export function mapBlizzardRaidToSeason(blizzardRaidName) {
  for (const [seasonId, season] of Object.entries(THE_WAR_WITHIN_SEASONS)) {
    const raid = season.raids.find(r => r.name === blizzardRaidName);
    if (raid) {
      return {
        seasonId,
        season,
        raid
      };
    }
  }
  return null;
}