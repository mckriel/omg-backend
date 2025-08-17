import config from '../app.config.js';

const { TANKS, HEALERS, GUILLD_RANKS, MAIN_RANKS, ALT_RANKS, MIN_TIER_ITEMLEVEL } = config;
const SEASON3_TIER_SETS = config.SEASON3_TIER_SETS;

/**
 * Transforms a character object into a standardized format for the API.
 * @param {Object} character - The raw character data.
 * @returns {Object} The transformed character data.
 */
function transformCharacterData(character) {
  const missingEnchants = character.equipement
    ?.filter(item => item.needsEnchant && !item.hasEnchant)
    ?.map(item => item.type) || [];

  let season3Set = 0;
  character.equipement?.forEach((item) => {
    if (item.isTierItem && item.level >= MIN_TIER_ITEMLEVEL) {
      const setName = item._raw?.set?.item_set?.name || "";
      const isSeason3 = SEASON3_TIER_SETS.some(tierSetName => setName.includes(tierSetName));
      if (isSeason3) {
        season3Set = season3Set + 1;
      }
    }
  });

  const hasQualifyingWaist = character.equipement?.some(
    (item) =>
      item.type === 'WAIST' &&
      item.name?.toLowerCase() === "durable information securing container"
  ) || false;

  const hasQualifyingCloak = character.equipement?.some(
    (item) =>
      (item.type === 'CLOAK' || item.type === 'BACK') &&
      item.name?.toLowerCase() === "reshii wraps"
  ) || false;

  const isTank = TANKS.includes(character.metaData?.spec);
  const isHealer = HEALERS.includes(character.metaData?.spec);
  const role = isTank ? 'tank' : isHealer ? 'healer' : 'dps';

  // Extract jewelry socket/gem summary information
  const jewelry_summary = {
    total_jewelry_pieces: 0,
    socketed_jewelry_pieces: 0,
    total_sockets: 0,
    gemmed_sockets: 0,
    empty_sockets: 0
  };

  character.equipement?.forEach((item) => {
    if (item.isJewelry || ['NECK', 'FINGER_1', 'FINGER_2'].includes(item.type)) {
      jewelry_summary.total_jewelry_pieces++;

      if (item.sockets?.hasSocket) {
        jewelry_summary.socketed_jewelry_pieces++;
        jewelry_summary.total_sockets += item.sockets.socketCount;
        jewelry_summary.gemmed_sockets += item.sockets.gemmedSockets;
        jewelry_summary.empty_sockets += item.sockets.emptySocketCount;
      }
    }
  });

  const guildRankIndex = character.guildData?.rank;
  const guildRank = guildRankIndex;

  return {
    name: character.name,
    server: character.server,
    class: character.metaData?.class,
    spec: character.metaData?.spec,
    itemLevel: character.itemlevel?.equiped,
    guildRank: guildRank,
    ready: character.ready,
    missingEnchants,
    missingEnchantsCount: missingEnchants.length,
    missingWaist: !hasQualifyingWaist,
    missingCloak: !hasQualifyingCloak,
    tierSets: {
      season3: season3Set,
      total: season3Set
    },
    mplus: character.mplus?.current_mythic_rating?.rating || 0,
    pvp: character.pvp?.rating || 0,
    hasTierSet: season3Set >= 4,
    jewelry: jewelry_summary,
    isActiveInSeason3: character.isActiveInSeason3,
    lockStatus: character.lockStatus,
    media: character.media,
    metaData: {
      ...character.metaData,
      role
    },
    stats: character.stats || null
  };
}

/**
 * Applies filters to a list of character data.
 * @param {Array} data - The array of character objects.
 * @param {Object} filters - The filters to apply.
 * @returns {Array} The filtered character data.
 */
function applyFilters(data, filters) {
  const {
    search = '',
    rankFilter = 'all',
    classFilter = '',
    specFilter = 'all',
    minItemLevel = 0,
    filter = 'all'
  } = filters;

  let filteredData = data;

  if (search) {
    filteredData = filteredData.filter(character => 
      character.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (rankFilter !== 'all') {
    if (rankFilter === 'mains') {
      filteredData = filteredData.filter(character => 
        MAIN_RANKS.includes(GUILLD_RANKS.indexOf(character.guildRank))
      );
    } else if (rankFilter === 'alts') {
      filteredData = filteredData.filter(character => 
        ALT_RANKS.includes(GUILLD_RANKS.indexOf(character.guildRank))
      );
    }
  }

  if (classFilter) {
    const classes = classFilter.split(',').map(c => c.trim());
    filteredData = filteredData.filter(character => 
      classes.includes(character.metaData?.class)
    );
  }

  if (specFilter !== 'all') {
    if (specFilter === 'tanks') {
      filteredData = filteredData.filter(character => 
        TANKS.includes(character.metaData?.spec)
      );
    } else if (specFilter === 'healers') {
      filteredData = filteredData.filter(character => 
        HEALERS.includes(character.metaData?.spec)
      );
    } else if (specFilter === 'dps') {
      filteredData = filteredData.filter(character => 
        !TANKS.includes(character.metaData?.spec) && !HEALERS.includes(character.metaData?.spec)
      );
    }
  }

  if (minItemLevel > 0) {
    filteredData = filteredData.filter(character => 
      character.itemLevel >= parseInt(minItemLevel)
    );
  }

  switch (filter) {
    case 'missing-enchants':
      filteredData = filteredData.filter(character => 
        character.missingEnchants && character.missingEnchants.length > 0
      );
      break;
    case 'locked-normal':
      filteredData = filteredData.filter(character => 
        character.lockStatus?.lockedTo?.Normal
      );
      break;
    case 'locked-heroic':
      filteredData = filteredData.filter(character => 
        character.lockStatus?.lockedTo?.Heroic
      );
      break;
    case 'locked-mythic':
      filteredData = filteredData.filter(character => 
        character.lockStatus?.lockedTo?.Mythic
      );
      break;
    case 'missing-tier':
      filteredData = filteredData.filter(character => 
        !character.hasTierSet
      );
      break;
    case 'not-ready':
      filteredData = filteredData.filter(character => 
        !character.ready
      );
      break;
    case 'active-season3':
      filteredData = filteredData.filter(character => 
        character.isActiveInSeason3
      );
      break;
    case 'has-pvp-rating':
      filteredData = filteredData.filter(character => 
        character.pvp > 0
      );
      break;
    case 'has-mplus-score':
      filteredData = filteredData.filter(character => 
        character.mplus > 0
      );
      break;
    default:
      break;
  }

  filteredData.sort((a, b) => b.itemLevel - a.itemLevel);

  return filteredData;
}

/**
 * Calculates statistics from character data.
 * @param {Array} data - The array of character objects.
 * @returns {Object} The calculated statistics.
 */
function calculateStatistics(data) {
  const sortedData = [...data].sort((a, b) => b.itemLevel - a.itemLevel);
  const totalMembers = sortedData.length;
  const missingEnchants = sortedData.filter(char => char.missingEnchants.length > 0).length;
  const raidLocked = sortedData.filter(char => char.lockStatus?.isLocked).length;
  const topPvp = sortedData
    .filter(char => char.pvp > 0)
    .sort((a, b) => b.pvp - a.pvp)
    .slice(0, 5);
  const topPve = sortedData
    .filter(char => char.mplus > 0)
    .sort((a, b) => b.mplus - a.mplus)
    .slice(0, 5);
  const tanks = sortedData.filter(char => TANKS.includes(char.spec)).length;
  const healers = sortedData.filter(char => HEALERS.includes(char.spec)).length;
  const dps = sortedData.filter(char => !TANKS.includes(char.spec) && !HEALERS.includes(char.spec)).length;
  return {
    totalMembers,
    missingEnchants,
    raidLocked,
    avgTopMplus: topPve.length > 0 ? topPve.reduce((acc, p) => acc + p.mplus, 0) / topPve.length : 0,
    avgTopPvp: topPvp.length > 0 ? topPvp.reduce((acc, p) => acc + p.pvp, 0) / topPvp.length : 0,
    roleCounts: { tanks, healers, dps },
    topPvp,
    topPve
  };
}

/**
 * Gets the next scheduled update time as an ISO string.
 * @returns {string} The ISO string of the next scheduled update.
 */
function getNextScheduledUpdate() {
  const now = new Date();
  const nextUpdate = new Date(now.getTime() + (30 * 60 * 1000)); // 30 minutes from now
  return nextUpdate.toISOString();
}

export { transformCharacterData, applyFilters, calculateStatistics, getNextScheduledUpdate }; 