/**
 * @file Route handlers for guild raid progress endpoints
 * @module routes/guildRaidProgress
 */

import express from 'express';
import { 
  getGuildRaidProgressAllSeasons,
  getGuildRaidProgressAllSeasonsCached,
  getGuildRaidProgressBySeason, 
  getGuildRaidProgressBySeasonCached,
  getCurrentSeasonGuildProgress,
  getGuildProgressSummary
} from '../services/guildRaidProgress.js';
import { getAllSeasons, getSeasonInfo } from '../config/seasons.js';

const router = express.Router();

/**
 * GET /guild-progress - Returns guild raid progress summary for home page
 * @route GET /guild-progress
 * @returns {Object} JSON response with simplified guild progress data
 */
router.get('/', async (req, res) => {
  try {
    const summary = await getGuildProgressSummary();
    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get guild progress summary', 
      message: error.message 
    });
  }
});

/**
 * GET /guild-progress/all-seasons - Returns comprehensive guild progress for all seasons
 * @route GET /guild-progress/all-seasons
 * @returns {Object} JSON response with complete guild progress data
 */
router.get('/all-seasons', async (req, res) => {
  try {
    const { force } = req.query; // Allow forcing live calculation with ?force=true
    const forceCalculate = force === 'true';
    
    const progressData = await getGuildRaidProgressAllSeasonsCached(forceCalculate);
    res.json({
      success: true,
      data: progressData,
      timestamp: new Date().toISOString(),
      cached: progressData.cached || false
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get all seasons guild progress', 
      message: error.message 
    });
  }
});

/**
 * GET /guild-progress/current - Returns guild progress for current season
 * @route GET /guild-progress/current
 * @returns {Object} JSON response with current season progress
 */
router.get('/current', async (req, res) => {
  try {
    const progressData = await getCurrentSeasonGuildProgress();
    res.json({
      success: true,
      data: progressData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get current season guild progress', 
      message: error.message 
    });
  }
});

/**
 * GET /guild-progress/season/:seasonId - Returns guild progress for specific season
 * @route GET /guild-progress/season/:seasonId
 * @param {string} seasonId - Season identifier (e.g., 'season-1', 'season-2')
 * @returns {Object} JSON response with season-specific progress
 */
router.get('/season/:seasonId', async (req, res) => {
  try {
    const { seasonId } = req.params;
    const { force } = req.query; // Allow forcing live calculation with ?force=true
    
    // Validate season exists
    const seasonInfo = getSeasonInfo(seasonId);
    if (!seasonInfo) {
      return res.status(404).json({
        success: false,
        error: 'Season not found',
        availableSeasons: getAllSeasons().map(s => ({ id: s.id, name: s.name }))
      });
    }
    
    const forceCalculate = force === 'true';
    const progressData = await getGuildRaidProgressBySeasonCached(seasonId, forceCalculate);
    
    res.json({
      success: true,
      data: progressData,
      timestamp: new Date().toISOString(),
      cached: progressData.cached || false
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: `Failed to get guild progress for season ${req.params.seasonId}`, 
      message: error.message 
    });
  }
});

/**
 * GET /guild-progress/seasons - Returns list of available seasons
 * @route GET /guild-progress/seasons
 * @returns {Object} JSON response with available seasons
 */
router.get('/seasons', (req, res) => {
  try {
    const seasons = getAllSeasons().map(season => ({
      id: season.id,
      name: season.name,
      startDate: season.startDate,
      endDate: season.endDate,
      raids: season.raids.map(raid => ({
        id: raid.id,
        name: raid.name,
        bossCount: raid.bossCount
      }))
    }));
    
    res.json({
      success: true,
      data: seasons,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get available seasons', 
      message: error.message 
    });
  }
});

export default router;