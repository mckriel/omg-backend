import raid_team_member from '../models/raid_team_model.js';
import { getSettingValue } from '../database.js';

function calculate_raid_ready(character) {
  const min_ilvl = parseInt(process.env.RAID_TEAM_ILVL) || 690;
  if (!character.itemlevel?.equiped || character.itemlevel.equiped < min_ilvl) {
    return false;
  }

  const missing_enchants = character.equipement
    ?.filter(item => item.needsEnchant && !item.hasEnchant)
    ?.length || 0;
  if (missing_enchants > 0) {
    return false;
  }

  const jewelry_pieces = character.equipement?.filter(item => 
    item.isJewelry || ['NECK', 'FINGER_1', 'FINGER_2'].includes(item.type)
  ) || [];

  let total_sockets = 0;
  let gemmed_sockets = 0;

  jewelry_pieces.forEach(item => {
    if (item.sockets?.hasSocket) {
      total_sockets += item.sockets.socketCount || 0;
      gemmed_sockets += item.sockets.gemmedSockets || 0;
    }
  });

  if (total_sockets < 6 || gemmed_sockets < 6) {
    return false;
  }

  const cloak_item = character.equipement?.find(item => 
    item.type === 'CLOAK' || item.type === 'BACK'
  );
  
  const has_reshi_wraps = cloak_item?.name?.toLowerCase() === "reshi wraps";
  
  if (!has_reshi_wraps) {
    return false;
  }

  return true;
}

function transform_character_for_raid_team(character) {
  const tier_ilvl_min = parseInt(process.env.TIER_ILVL_MIN) || 660;
  const tier_ilvl_max = parseInt(process.env.TIER_ILVL_MAX) || 740;
  
  let season3_tier_count = 0;
  character.equipement?.forEach((item) => {
    if (item.isTierItem && item.level >= tier_ilvl_min && item.level <= tier_ilvl_max) {
      season3_tier_count++;
    }
  });

  const jewelry_pieces = character.equipement?.filter(item => 
    item.isJewelry || ['NECK', 'FINGER_1', 'FINGER_2'].includes(item.type)
  ) || [];

  const jewelry_summary = {
    total_jewelry_pieces: jewelry_pieces.length,
    socketed_jewelry_pieces: 0,
    total_sockets: 0,
    gemmed_sockets: 0,
    empty_sockets: 0
  };

  jewelry_pieces.forEach(item => {
    if (item.sockets?.hasSocket) {
      jewelry_summary.socketed_jewelry_pieces++;
      jewelry_summary.total_sockets += item.sockets.socketCount || 0;
      jewelry_summary.gemmed_sockets += item.sockets.gemmedSockets || 0;
      jewelry_summary.empty_sockets += item.sockets.emptySocketCount || 0;
    }
  });

  const cloak_item = character.equipement?.find(item => 
    item.type === 'CLOAK' || item.type === 'BACK'
  );
  const missing_cloak = !(cloak_item?.name?.toLowerCase() === "reshi wraps");

  const tanks = ["Blood", "Vengeance", "Guardian", "Brewmaster", "Protection"];
  const healers = ["Preservation", "Mistweaver", "Holy", "Discipline", "Restoration"];
  const is_tank = tanks.includes(character.metaData?.spec);
  const is_healer = healers.includes(character.metaData?.spec);
  const role = is_tank ? 'tank' : is_healer ? 'healer' : 'dps';

  return {
    name: character.name,
    server: character.server,
    class: character.metaData?.class,
    spec: character.metaData?.spec,
    role: role,
    item_level: character.itemlevel?.equiped || 0,
    guild_rank: character.guildData?.rank || 0,
    raid_ready: calculate_raid_ready(character),
    missing_enchants_count: character.equipement
      ?.filter(item => item.needsEnchant && !item.hasEnchant)
      ?.length || 0,
    missing_cloak: missing_cloak,
    cloak_item_level: cloak_item?.level || 0,
    tier_sets: {
      season3: season3_tier_count,
      total: season3_tier_count
    },
    has_tier_set: season3_tier_count >= 4,
    jewelry: jewelry_summary,
    meta_data: {
      class: character.metaData?.class,
      spec: character.metaData?.spec,
      last_updated: new Date(character.metaData?.lastUpdated),
      role: role
    },
    media: character.media || {},
    is_active: true,
    last_updated: new Date()
  };
}

export async function process_guild_data(guild_members) {
  try {
    if (!guild_members || !Array.isArray(guild_members)) {
      throw new Error('Invalid guild members data provided');
    }

    let processed_count = 0;
    let updated_count = 0;
    let created_count = 0;
    const errors = [];

    for (const character of guild_members) {
      try {
        const raid_team_data = transform_character_for_raid_team(character);
        
        const result = await raid_team_member.updateOne(
          { name: character.name, server: character.server },
          { $set: raid_team_data },
          { upsert: true }
        );

        if (result.upsertedCount > 0) {
          created_count++;
          console.log(`✅ Created raid team record: ${character.name}-${character.server} (Ready: ${raid_team_data.raid_ready})`);
        } else if (result.modifiedCount > 0) {
          updated_count++;
          console.log(`🔄 Updated raid team record: ${character.name}-${character.server} (Ready: ${raid_team_data.raid_ready})`);
        } else {
          console.log(`⚪ No changes for raid team record: ${character.name}-${character.server} (Ready: ${raid_team_data.raid_ready})`);
        }

        processed_count++;
      } catch (error) {
        console.log(`❌ Failed to process raid team record: ${character.name}-${character.server} - ${error.message}`);
        errors.push({
          character: `${character.name}-${character.server}`,
          error: error.message
        });
      }
    }

    const current_names = guild_members.map(char => char.name);
    const inactive_result = await raid_team_member.updateMany(
      { 
        is_active: true, 
        name: { $nin: current_names } 
      },
      { 
        $set: { 
          is_active: false, 
          last_updated: new Date() 
        } 
      }
    );

    console.log(`✅ Raid team processing complete:`, {
      processed: processed_count,
      created: created_count,
      updated: updated_count,
      deactivated: inactive_result.modifiedCount,
      errors: errors.length
    });

    return {
      success: true,
      processed: processed_count,
      created: created_count,
      updated: updated_count,
      deactivated: inactive_result.modifiedCount,
      errors: errors
    };

  } catch (error) {
    console.error('❌ Failed to process guild data for raid team:', error);
    throw error;
  }
}

export async function get_all_raid_team_members() {
  try {
    const members = await raid_team_member.find({ is_active: true })
      .sort({ raid_ready: -1, item_level: -1 })
      .lean();
    
    return members;
  } catch (error) {
    console.error('❌ Failed to get raid team members:', error);
    throw error;
  }
}

export async function get_raid_ready_count() {
  try {
    const count = await raid_team_member.countDocuments({ 
      is_active: true, 
      raid_ready: true 
    });
    
    return count;
  } catch (error) {
    console.error('❌ Failed to get raid ready count:', error);
    return 0;
  }
}