/**
 * @file Route handler for /settings endpoints.
 * @module routes/settings
 */

import express from 'express';
import { 
  getSettingsDocument, 
  updateSettingsDocument, 
  getSettingValue, 
  updateSettingValue,
  initializeDefaultSettings 
} from '../database.js';

const router = express.Router();

/**
 * GET /settings/:collection - Get all settings for a collection
 * @route GET /settings/raid-team
 * @returns {Object} JSON response with settings data
 */
router.get('/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const { document = 'general' } = req.query;

    console.log(`📋 Getting settings for collection: ${collection}, document: ${document}`);

    const settings_document = await getSettingsDocument(collection, document);

    if (!settings_document) {
      return res.status(404).json({
        success: false,
        error: 'Settings not found',
        message: `No settings found for collection ${collection}`
      });
    }

    res.json({
      success: true,
      collection,
      document,
      settings: settings_document.settings,
      lastUpdated: settings_document.lastUpdated
    });

  } catch (error) {
    console.error('❌ Failed to get settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings',
      message: error.message
    });
  }
});

/**
 * GET /settings/:collection/:key - Get a specific setting value
 * @route GET /settings/raid-team/ilvl-requirement
 * @returns {Object} JSON response with setting value
 */
router.get('/:collection/:key', async (req, res) => {
  try {
    const { collection, key } = req.params;
    const { document = 'general' } = req.query;

    console.log(`🔍 Getting setting: ${collection}:${key} from document: ${document}`);

    const value = await getSettingValue(collection, key, document);

    if (value === null) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found',
        message: `No setting found for ${collection}:${key}`
      });
    }

    res.json({
      success: true,
      collection,
      document,
      key,
      value
    });

  } catch (error) {
    console.error('❌ Failed to get setting value:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch setting value',
      message: error.message
    });
  }
});

/**
 * POST /settings/:collection - Update all settings for a collection
 * @route POST /settings/raid-team
 * @body {Object} settings - The settings object to save
 * @returns {Object} JSON response with update result
 */
router.post('/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const { document = 'general' } = req.query;
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Settings object is required'
      });
    }

    console.log(`📝 Updating settings for collection: ${collection}, document: ${document}`, settings);

    const result = await updateSettingsDocument(collection, document, settings);

    res.json({
      success: true,
      collection,
      document,
      settings,
      modified: result.modifiedCount > 0 || result.upsertedCount > 0,
      upserted: result.upsertedCount > 0
    });

  } catch (error) {
    console.error('❌ Failed to update settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings',
      message: error.message
    });
  }
});

/**
 * PUT /settings/:collection/:key - Update a specific setting value
 * @route PUT /settings/raid-team/ilvl-requirement
 * @body {any} value - The new value for the setting
 * @returns {Object} JSON response with update result
 */
router.put('/:collection/:key', async (req, res) => {
  try {
    const { collection, key } = req.params;
    const { document = 'general' } = req.query;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Value is required'
      });
    }

    // Validation for specific settings
    if (collection === 'raid-team' && key === 'ilvl-requirement') {
      const ilvl = parseInt(value);
      if (isNaN(ilvl) || ilvl < 400 || ilvl > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Invalid value',
          message: 'Item level must be between 400 and 1000'
        });
      }
    }

    console.log(`🔧 Updating setting: ${collection}:${key} = ${value} in document: ${document}`);

    const result = await updateSettingValue(collection, key, value, document);

    res.json({
      success: true,
      collection,
      document,
      key,
      value,
      modified: result.modifiedCount > 0 || result.upsertedCount > 0,
      upserted: result.upsertedCount > 0
    });

  } catch (error) {
    console.error('❌ Failed to update setting value:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update setting value',
      message: error.message
    });
  }
});

/**
 * POST /settings/initialize - Initialize default settings
 * @route POST /settings/initialize
 * @returns {Object} JSON response with initialization result
 */
router.post('/initialize', async (req, res) => {
  try {
    console.log('🔄 Initializing default settings...');

    await initializeDefaultSettings();

    res.json({
      success: true,
      message: 'Default settings initialized successfully'
    });

  } catch (error) {
    console.error('❌ Failed to initialize default settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize default settings',
      message: error.message
    });
  }
});

export default router;