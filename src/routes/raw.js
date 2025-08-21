import express from 'express';
import { get_raw_collection_data, get_allowed_collections } from '../services/raw.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { collection } = req.query;
    
    if (!collection) {
      const allowed_collections = get_allowed_collections();
      return res.status(400).json({
        success: false,
        error: 'Missing collection parameter',
        message: 'Please specify a collection name in the query parameter',
        example: '/raw?collection=members',
        allowed_collections: allowed_collections
      });
    }

    const raw_data = await get_raw_collection_data(collection);
    
    res.json({
      success: true,
      data: raw_data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get raw collection data',
      message: error.message
    });
  }
});

export default router;