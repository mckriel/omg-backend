import express from 'express';
import { get_all_raid_team_members } from '../services/raid_team.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const raid_team_members = await get_all_raid_team_members();
    
    if (!raid_team_members.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'No raid team data available' 
      });
    }

    res.json({
      success: true,
      data: raid_team_members,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get raid team data', 
      message: error.message 
    });
  }
});

export default router;