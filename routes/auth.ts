/** @format */
import multer from 'multer';
import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import User from '../models/User.js'
import fetchuser from '../middleware/fetchuser.js';
import { transferSplToken } from '../controllers/controller.js';

// Set up Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Uploads will be saved in the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});

const upload = multer({ storage });

const router = express.Router();

const JWT_SECRET = 'Farman$isagoodboy';

router.post('/createuser', [
  body('name', 'Enter a valid name').isLength({ min: 3 }),
  body('email', 'Enter a valid email').isEmail(),
  body('password', 'Password must be atleast 5 characters').isLength({ min: 5 })
], async (req: any, res: any) => {
  let success = false;
  //If there are errors, return Bad request and the errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success, errors: errors.array() });
  }
  //Check whether the user with this email already exists
  try {
    let user = await User.findOne({ email: req.body.email });

    if (user) {
      return res.status(400).json({ success, error: "Sorry a user with this email already exists" })
    }
    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(req.body.password, salt);
    //create a new user
    user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: secPass,
    });

    const data = {
      user: {
        id: user.id
      }
    }
    const authtoken = jwt.sign(data, JWT_SECRET);
    // res.json(user)
    success = true;
    res.json({ success, authtoken })
    // Catch errors 
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('An unknown error occurred:', error);
    }
    res.status(500).send("Some Error occured");
  }
})

// ROUTE 2:Authenticate a User using: POST "/api/auth/login". No login required
router.post('/login', [
  body('email', 'Enter a valid email').isEmail(),
  body('password', 'Password cannot be blank').exists()
], async (req: any, res: any) => {
  let success = false;
  //If there are errors, return Bad request and the errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success, error: "Please try to login with correct Credentials" });
    }
    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      return res.status(400).json({ success, error: "Please try to login with correct Credentials" });
    }
    const data = {
      user: {
        id: user.id
      }
    }
    const authtoken = jwt.sign(data, JWT_SECRET);
    success = true;
    res.json({ success, authtoken })

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('An unknown error occurred:', error);
    }
    res.status(500).send("Internal Server Error");
  }
})

router.post('/getuser', fetchuser, async (req: any, res: any) => {

  try {
    let userId = req.user!.id;
    let user = await User.findById(userId).select("-password");
    res.status(200).json(user)
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('An unknown error occurred:', error);
    }
    res.status(500).send("Internal Server Error");
  }

})

router.post('/uploadrequest', fetchuser, upload.single('image'), async (req: any, res: any) => {

  try {
    const { wallet } = req.body;
    let userId = req.user!.id;
    let user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const imageurl = req.file ? `/uploads/${req.file.filename}` : null;

    // Update the user
    user.wallet = wallet;
    if (imageurl) user.imageurl = imageurl;
    user.progress = 1; // Set progress to 1 (In progress)

    const updatedUser = await user.save();

    return res.status(200).json({ updatedUser, success: true, message: "User updated successfully!" });

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('An unknown error occurred:', error);
    }
    res.status(500).send("Internal Server Error");
  }
});


router.post('/fetchinprogress', fetchuser, async (req: any, res: any) => {

  try {
    let userId = req.user!.id;
    let user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.isAdmin) {
      const inProgressUsers = await User.find({ progress: 1 }).select("-password");
      return res.status(200).json({ inProgressUsers, success: true });
    } else {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('An unknown error occurred:', error);
    }
    res.status(500).send("Internal Server Error");
  }

})

router.post('/fetchcompleted', fetchuser, async (req: any, res: any) => {

  try {
    let userId = req.user!.id;
    let user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.isAdmin) {
      const completedUsers = await User.find({ progress: { $in: [2, 3] } }).select("-password");
      return res.status(200).json({ completedUsers, success: true });
    } else {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('An unknown error occurred:', error);
    }
    res.status(500).send("Internal Server Error");
  }

})

router.post("/updateprogress", fetchuser, async (req: any, res: any) => {
  const { userId, progress } = req.body;

  if (![2, 3].includes(progress)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  try {
    let adminId = req.user!.id;
    let admin = await User.findById(adminId).select("-password");
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    if (admin.isAdmin) {
      const user = await User.findById(userId).select("-password");;

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (progress === 2) {
        transferSplToken(user.wallet!);
      }

      user.progress = progress;

      const updatedUser = await user.save();

      res.json({ success: true, message: "User status updated", updatedUser });

    } else {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;