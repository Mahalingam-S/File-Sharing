const Department = require('../models/Department');
const AuditLog = require('../models/AuditLog');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Public
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create a new department
// @route   POST /api/departments
// @access  Private/Admin
const createDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: 'Please provide department name and code' });
    }

    const deptExists = await Department.findOne({
      $or: [{ name }, { code: code.toUpperCase() }]
    });

    if (deptExists) {
      return res.status(400).json({ message: 'Department with this name or code already exists' });
    }

    const department = await Department.create({
      name,
      code: code.toUpperCase(),
      description
    });

    // Create Audit Log
    await AuditLog.create({
      userId: req.user._id,
      action: 'upload', // Using upload as generic creation in system
      entityType: 'user', // System configuration
      entityId: department._id,
      details: `Created new department: ${name} (${code.toUpperCase()})`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
    });

    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update a department
// @route   PUT /api/departments/:id
// @access  Private/Admin
const updateDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    let department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check duplicate name or code if changing
    if (name && name !== department.name) {
      const nameExists = await Department.findOne({ name });
      if (nameExists) {
        return res.status(400).json({ message: 'Department name already exists' });
      }
      department.name = name;
    }

    if (code && code.toUpperCase() !== department.code) {
      const codeExists = await Department.findOne({ code: code.toUpperCase() });
      if (codeExists) {
        return res.status(400).json({ message: 'Department code already exists' });
      }
      department.code = code.toUpperCase();
    }

    if (description !== undefined) {
      department.description = description;
    }

    await department.save();

    // Create Audit Log
    await AuditLog.create({
      userId: req.user._id,
      action: 'share', // Using share as generic update in system
      entityType: 'user',
      entityId: department._id,
      details: `Updated department: ${department.name} (${department.code})`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
    });

    res.status(200).json(department);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a department
// @route   DELETE /api/departments/:id
// @access  Private/Admin
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Prevent deleting general drive department
    if (department.code === 'GENERAL') {
      return res.status(400).json({ message: 'Cannot delete the General Drive department' });
    }

    await Department.findByIdAndDelete(req.params.id);

    // Create Audit Log
    await AuditLog.create({
      userId: req.user._id,
      action: 'delete',
      entityType: 'user',
      entityId: department._id,
      details: `Deleted department: ${department.name} (${department.code})`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
    });

    res.status(200).json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
