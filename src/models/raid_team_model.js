import mongoose from 'mongoose';

const raid_team_member_model = new mongoose.Schema({
  name: { type: String, required: true },
  server: { type: String, required: true },
  class: { type: String, required: true },
  spec: { type: String, required: true },
  role: { type: String, enum: ['tank', 'healer', 'dps'], required: true },
  item_level: { type: Number, required: true },
  guild_rank: { type: String, required: true },
  raid_ready: { type: Boolean, default: false },
  missing_enchants_count: { type: Number, default: 0 },
  missing_cloak: { type: Boolean, default: false },
  cloak_item_level: { type: Number, default: 0 },
  tier_sets: { type: Object, default: {} },
  has_tier_set: { type: Boolean, default: false },
  jewelry: { type: Object, default: {} },
  lockout_status: { type: Object, default: {} },
  meta_data: { type: Object, required: true },
  media: { type: Object, default: {} },
  is_active: { type: Boolean, default: true },
  last_updated: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'raid-team'
});

// indexes
raid_team_member_model.index({ name: 1, server: 1 }, { unique: true });
raid_team_member_model.index({ raid_ready: 1 });
raid_team_member_model.index({ is_active: 1 });

const raid_team_member = mongoose.model('raid_team_member', raid_team_member_model);

export default raid_team_member;