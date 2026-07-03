import logger from '../utils/logger.js';
import User from '../models/User.js';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const search = (req.query.search || '').trim();
    let filter = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(escaped, 'i');
      filter = { $or: [{ name: pattern }, { email: pattern }] };
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      },
      message: 'Users fetched successfully'
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server Error while fetching users' });
  }
};

// @desc    Update user credits
// @route   PUT /api/admin/users/:id/credits
// @access  Private/Admin
export const updateUserCredits = async (req, res) => {
  try {
    const { credits } = req.body;
    
    if (credits === undefined || typeof credits !== 'number') {
      return res.status(400).json({ success: false, message: 'Please provide a valid number of credits' });
    }

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.credits = credits;
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      message: 'User credits updated successfully'
    });
  } catch (error) {
    logger.error('Error updating user credits:', error);
    res.status(500).json({ success: false, message: 'Server Error while updating credits' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
       return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Server Error while deleting user' });
  }
};
