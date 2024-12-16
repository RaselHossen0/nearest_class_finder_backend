
const  ClassOwner  = require('../models/ClassOwner'); // Adjust the path as necessary
const  User  = require('../models/User'); // Adjust the path as necessary

// Admin API to approve/reject ClassOwner
exports.verifyClassOwner = async (req, res) => {
    try {
      const { id } = req.params; // ClassOwner ID
      const { action } = req.body; // 'approve' or 'reject'
  
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action. Use "approve" or "reject".' });
      }
  //fetch all classowner
//   const classOwners = await ClassOwner.findAll();
//   console.log(classOwners);
      // Fetch the ClassOwner record
      const classOwner = await ClassOwner.findByPk(id);
      if (!classOwner) {
        return res.status(404).json({ error: 'ClassOwner not found' });
      }
  
      const user = await User.findByPk(classOwner.userId);
      if (!user) {
        return res.status(404).json({ error: 'User associated with ClassOwner not found' });
      }
  
      if (action === 'approve') {
        user.adminVerified = true; // Approve the user
        await user.save();
        return res.status(200).json({ message: 'ClassOwner approved successfully' });
      }
  
      if (action === 'reject') {
        // Reject: Delete ClassOwner and associated user
        await classOwner.destroy();
        await user.destroy();
        return res.status(200).json({ message: 'ClassOwner rejected and data deleted successfully' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: `Failed to verify ClassOwner: ${error.message}` });
    }
};
// API to fetch all ClassOwner records


/**
 * @swagger
 * /admin/class-owner/{id}/verify:
 *   put:
 *     summary: Approve or Reject Class Owner Verification
 *     description: Admin API to approve or reject a Class Owner.
 *     tags:
 *       - Admin
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the Class Owner to verify
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 description: Action to perform ("approve" or "reject")
 *                 enum:
 *                   - approve
 *                   - reject
 *     responses:
 *       200:
 *         description: Action performed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ClassOwner approved successfully
 *       400:
 *         description: Invalid action
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid action. Use "approve" or "reject".
 *       404:
 *         description: ClassOwner or associated user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ClassOwner not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to verify ClassOwner: An unexpected error occurred"
 */