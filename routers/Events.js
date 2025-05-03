const express = require("express");
const { eventUpload } = require("../middlewares/upload"); // Import multer middleware
const eventdb = require("../models/event_details"); 
const path = require("path");
const mongoose = require('mongoose');
const router = express.Router();



// CREATE Event (With Image Upload)
router.post("/", eventUpload.single("flier"), async (req, res) => {
    try {
      // console.log(req.body);
      const { eventName, year, date, place, description, participants_count, outcome, Accepted_Jesus,Non_Christian_Accept_Jesus,} = req.body;
      const flierUrl = req.file ? `/uploads/event_fliers/${req.file.filename}` : '/uploads/event_fliers/DEFAULT_FLIER.png';
  
      const lastEvent = await eventdb.findOne().sort({ order: -1 });
      const nextOrder = lastEvent ? lastEvent.order + 1 : 1;

      const newEvent = new eventdb({
        eventName,
        year,
        date,
        place,
        flier: flierUrl,
        participants_count:  Number(participants_count),
        description,
        outcome,
        Accepted_Jesus: Number(Accepted_Jesus),
        Non_Christian_Accept_Jesus: Number(Non_Christian_Accept_Jesus),
        order: nextOrder,
      });
  
      await newEvent.save();

      res.json(newEvent);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  // GET all events
  router.get('/', async (req, res) => {
    try {
      const events = await eventdb.find().sort({ order: 1 }); // Sort by 'order' ascending
      res.status(200).json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events." });
    }
  });
  

  router.put('/reorder', async (req, res) => {
    console.log('Received reorder data:', req.body);
    const { reorderedIds } = req.body;
  
    try {
      const bulkOps = reorderedIds.map(({ id, order }) => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(id) }, // <--- convert to ObjectId
          update: { $set: { order } }
        }
      }));
  
      await eventdb.bulkWrite(bulkOps);
  
      res.status(200).json({ message: "Order updated successfully" });
    } catch (error) {
      console.error("Error reordering events:", error);
      res.status(500).json({ error: "Failed to reorder events" });
    }
  });








  
  // UPDATE Event (With Image Upload)
  router.put("/:id", eventUpload.single("flier"), async (req, res) => {
    try {
      const {
        eventName,
        year,
        date,
        place,
        description,
        participants_count,
        outcome,
        Accepted_Jesus,
        Non_Christian_Accept_Jesus,
      } = req.body;
  
      // Prepare the fields to update
      const updateData = {
        eventName,
        year,
        date,
        place,
        description,
        participants_count,
        outcome,
        Accepted_Jesus,
        Non_Christian_Accept_Jesus,
      };
  
      // Only update flier if a new file is uploaded
      if (req.file) {
        updateData.flier = `/uploads/event_fliers/${req.file.filename}`;
      }
  
      const updatedEvent = await eventdb.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );
  
      res.json(updatedEvent);
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  
  // DELETE Event
  // router.delete("/delete/:id", async (req, res) => {
  //   try {
  //     const event = await eventdb.findById(req.params.id);
  
  //     if (!event) {
  //       return res.status(404).json({ error: "Event not found" });
  //     }
  
  //     const fs = require("fs");
  //     const path = require("path");
  
  //     if (event.flier && !event.flier.includes("DEFAULT_FLIER")) {
  //       // Only delete the file if it's not the default
  //       const fileName = path.basename(event.flier);
  //       const filePath = path.join(__dirname, "../uploads/event_fliers/", fileName);
  
  //       fs.unlink(filePath, (err) => {
  //         if (err) {
  //           console.error("File delete failed:", err);
  //         } else {
  //           console.log("File deleted");
  //         }
  //       });
  //     }
  
  //     // Delete the event from the database
  //     await eventdb.findByIdAndDelete(req.params.id);
  //     console.log("Event deleted from DB");
  
  //     res.json({ message: "Event deleted successfully" });
  //   } catch (err) {
  //     console.error("Error deleting event:", err);
  //     res.status(500).json({ error: "Server error" });
  //   }
  // });

  router.delete("/delete/:id", async (req, res) => {
    try {
      const event = await eventdb.findById(req.params.id);
  
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
  
      const fs = require("fs");
      const path = require("path");
  
      // Step 1: Delete the file if it's not the default one
      if (event.flier && !event.flier.includes("DEFAULT_FLIER")) {
        const fileName = path.basename(event.flier);
        const filePath = path.join(__dirname, "../uploads/event_fliers/", fileName);
  
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("File delete failed:", err);
          } else {
            console.log("File deleted");
          }
        });
      }
  
      // Step 2: Find all events with a higher order
      const affectedEvents = await eventdb.find({ order: { $gt: event.order } });
  
      // Step 3: Decrease the order of each affected event
      const bulkOps = affectedEvents.map((e) => ({
        updateOne: {
          filter: { _id: e._id },
          update: { $inc: { order: -1 } }, // Decrease order by 1
        },
      }));
  
      // Perform the bulk update
      if (bulkOps.length > 0) {
        await eventdb.bulkWrite(bulkOps);
        console.log("Orders updated");
      }
  
      // Step 4: Delete the event from the database
      await eventdb.findByIdAndDelete(req.params.id);
      console.log("Event deleted from DB");
  
      res.json({ message: "Event deleted successfully and order updated" });
    } catch (err) {
      console.error("Error deleting event:", err);
      res.status(500).json({ error: "Server error" });
    }
  });
  
  
  // events.routes.js or similar
// router.put('/reorder', async (req, res) => {
//   console.log('aaaaaaaaaaaaaaaaaaaaaaaa',req.body);
//   const { reorderedIds } = req.body;
  
//   try {
//     const bulkOps = reorderedIds.map(({ id, order }) => ({
//       updateOne: {
//         filter: { _id: id },
//         update: { $set: { order } }
//       }
//     }));

//     await Event.bulkWrite(bulkOps);
//     res.status(200).json({ message: "Order updated" });
//   } catch (error) {
//     console.error("Error reordering events:", error);
//     res.status(500).json({ error: "Failed to reorder events" });
//   }
// });






  

  module.exports = router;