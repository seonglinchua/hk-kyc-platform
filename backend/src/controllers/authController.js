import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: { message: 'Please provide email and password' }
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        error: { message: 'Invalid credentials' }
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: { message: 'Invalid credentials' }
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user data and token
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: { message: 'Login failed' }
    });
  }
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public (for MVP, later restrict to admin)
export const register = async (req, res) => {
  try {
    const { email, username, password, name } = req.body;

    // Validate input
    if (!email || !username || !password || !name) {
      return res.status(400).json({
        error: { message: 'Please provide all required fields' }
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        error: { message: 'User with this email or username already exists' }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name,
        role: 'user'
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true
      }
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: { message: 'Registration failed' }
    });
  }
};

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
export const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    res.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: { message: 'Failed to get user information' }
    });
  }
};

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Public
export const logout = (req, res) => {
  // With JWT, logout is handled client-side by removing the token
  // This endpoint is here for consistency and can be used for future enhancements
  res.json({ message: 'Logged out successfully' });
};
