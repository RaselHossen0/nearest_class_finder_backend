const Feature = require('../models/Feature');

// Create a new feature
const createFeature = async (req, res) => {
  try {
    const { name, description } = req.body;
    const feature = await Feature.create({ name, description });
    return res.status(201).json({ success: true, message: 'Feature created successfully', data: feature });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating feature', error: error.message });
  }
};

// Get all features
const listFeatures = async (req, res) => {
  try {
    const features = await Feature.findAll();
    return res.status(200).json({ success: true, data: features });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching features', error: error.message });
  }
};

// Update a feature by ID
const updateFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const feature = await Feature.findByPk(id);

    if (!feature) {
      return res.status(404).json({ success: false, message: 'Feature not found' });
    }

    feature.name = name ?? feature.name;
    feature.description = description ?? feature.description;
    await feature.save();

    return res.status(200).json({ success: true, message: 'Feature updated successfully', data: feature });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating feature', error: error.message });
  }
};

// Delete a feature by ID
const deleteFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const feature = await Feature.findByPk(id);

    if (!feature) {
      return res.status(404).json({ success: false, message: 'Feature not found' });
    }

    await feature.destroy();
    return res.status(200).json({ success: true, message: 'Feature deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting feature', error: error.message });
  }
};

module.exports = { createFeature, listFeatures, updateFeature, deleteFeature };