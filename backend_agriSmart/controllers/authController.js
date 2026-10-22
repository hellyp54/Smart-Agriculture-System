const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getConnected } = require('../config/db');


// authController.js
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!getConnected()) {
      return res.status(201).json({ message: "Mock user registered successfully (DB Offline)" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ ADD THIS (hash password)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role
    });

    res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
  console.log("REGISTER ERROR:", error);
  console.log("REGISTER BODY:", req.body);
  res.status(500).json({ error: error.message });
}
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!getConnected()) {
      // Mock login when DB is offline
      console.log("LOGIN INPUT (MOCK):", email);
      const token = jwt.sign(
        { id: 'mock-id-123', email, role: 'Farmer' },
        process.env.JWT_SECRET || 'secret123',
        { expiresIn: '30d' }
      );
      return res.json({
        token,
        user: {
          id: 'mock-id-123',
          name: email.split('@')[0],
          email: email,
          role: 'Farmer'
        }
      });
    }

    console.log("LOGIN INPUT:", email, password);

    const user = await User.findOne({ email });
    console.log("USER FOUND:", user);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("PASSWORD MATCH:", isMatch);

    if (isMatch) {
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'secret123',
        { expiresIn: '30d' }
      );

      return res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      return res.status(401).json({ message: "Password incorrect" });
    }

  } catch (error) {
    console.log("LOGIN ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};