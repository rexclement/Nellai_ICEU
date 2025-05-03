const membersdb = require( "../models/Members_details" );
const express = require('express');
const router = express.Router();
const { teamMemberUpload } = require('../middlewares/upload');
const fs = require('fs');
const path = require('path');

// Predefined roles (match naming of default images)
const predefinedRoles = [
  "President",
  "Secretary",
  "Treasurer",
  "Prayer Secretary",
  "Outreach Secretary",
  "Cell care secretary",
  "Literature Secretary",
  "Music Secretary",
  "Representative",
  "Senior advisor family",
  "Young Graduate senior advisor",
  "Students ministry Secretary",
  "Staff worker"
];



router.get('/', async (req, res) => {
    try {
      const members = await membersdb.find();
      res.json(members);
    } catch (error) {
      console.error('Error fetching members:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  });


// POST /api/members
router.post("/add", teamMemberUpload.single("photo"), async (req, res) => {
  try {
    const { name, role, priority, description } = req.body;

    let photoUrl;

    if (req.file) {
      // Case 1: User uploaded a photo
      photoUrl = `/uploads/team_members/${req.file.filename}`;
    } else {
      // Case 2: No photo uploaded
      const normalizedRole = role.toLowerCase().replace(/\s+/g, '-');
      const isPredefined = predefinedRoles.some(
        r => r.toLowerCase() === role.toLowerCase()
      );

      if (isPredefined) {
        // Use role-specific default image
        photoUrl = `/uploads/team_members/defaults/${normalizedRole}.png`;
      } else {
        // Use general default image for custom roles
        photoUrl = `/uploads/team_members/defaults/default.png`;
      }
    }

    const newMember = new membersdb({
      name,
      role,
      priority: Number(priority),
      description,
      photo: photoUrl,
    });

    const savedMember = await newMember.save();
    res.json(savedMember);
  } catch (error) {
    console.error("Error saving member:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




router.put('/:id', teamMemberUpload.single('photo'), async (req, res) => {
  try {
    
    const { name, description, role, priority } = req.body;

    const member = await membersdb.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Delete old photo if new one uploaded and old one is NOT a default
    if (req.file && req.file.filename) {
      const oldPhotoPath = member.photo;

      const isDefaultImage = oldPhotoPath.includes('team_members/defaults');

      if (!isDefaultImage) {
        const fileName = path.basename(oldPhotoPath); // safely get filename
        const filePath = path.join(__dirname, '../uploads/team_members', fileName);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Old photo deleted:', filePath);
        }
      }
    }

    const updateData = {
      name,
      description,
      role,
      priority: parseInt(priority),
      photo: req.file ? `/uploads/team_members/${req.file.filename}` : member.photo,
    };

    const updatedMember = await membersdb.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    

    if (!updatedMember) {
      return res.status(404).json({ message: 'Member update failed' });
    }

    res.json({
      ...updatedMember.toObject(),
      photo: updateData.photo,
    });
  } catch (err) {
    console.error('Error updating member:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

  
  
  router.delete('/delete/:id', async (req, res) => {
    try {
     
      const member = await membersdb.findById(req.params.id);
  
      if (!member) {
        return res.status(404).json({ error: 'Member not found' });
      }
  
      const fs = require('fs');
      const path = require('path');
  
      if (member.photo && !member.photo.includes('defaults')) {
        // Only delete the file if it's not a default image
        const fileName = path.basename(member.photo); // safely extract filename
        const filePath = path.join(__dirname, '../uploads/team_members/', fileName);
  
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error('File delete failed:', err);
          } else {
            console.log('Member photo deleted');
          }
        });
      }
  
      // Delete the member from the database
      await membersdb.findByIdAndDelete(req.params.id);
      console.log('Member deleted from DB');
  
      res.json({ message: 'Member deleted successfully' });
    } catch (err) {
      console.error('Error deleting member:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  

module.exports = router;

