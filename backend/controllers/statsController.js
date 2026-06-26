import logger from '../utils/logger.js';
import Article from '../models/Article.js';
import User from '../models/User.js';
import ProcessedPayment from '../models/ProcessedPayment.js';

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Run all queries in parallel for performance
    const [
      totalUsers,
      totalArticles,
      recentUsers,
      recentArticles,
      totalRevenue,
      recentRevenue,
      dailyArticles,
      topKeywords,
    ] = await Promise.all([
      User.countDocuments({}),
      Article.countDocuments({}),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Article.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      ProcessedPayment.aggregate([
        { $group: { _id: null, total: { $sum: '$credits' } } }
      ]),
      ProcessedPayment.aggregate([
        { $match: { processedAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$credits' } } }
      ]),
      // Daily article count for the last 7 days
      Article.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          }
        },
        { $sort: { _id: 1 } },
      ]),
      // Top 10 keywords
      Article.aggregate([
        {
          $group: {
            _id: { $toLower: '$keyword' },
            count: { $sum: 1 },
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    // Fill in missing days for the chart
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const found = dailyArticles.find(d => d._id === dateStr);
      chartData.push({
        date: dateStr,
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: found ? found.count : 0,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalArticles,
          newUsers30d: recentUsers,
          newArticles30d: recentArticles,
          totalCreditsPurchased: totalRevenue[0]?.total || 0,
          recentCreditsPurchased: recentRevenue[0]?.total || 0,
        },
        chartData,
        topKeywords: topKeywords.map(k => ({ keyword: k._id, count: k.count })),
      },
    });
  } catch (error) {
    logger.error('Dashboard Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics.' });
  }
};
