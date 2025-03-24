const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL,
    pass: process.env.GOOGLE_APP_PASSWORD
  }
});

// Generate verification token
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Send verification email
async function sendVerificationEmail(email, token) {
  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.GMAIL,
    to: email,
    subject: 'Verify Your Email - URL Shortener',
    html: `
      <h1>Welcome to URL Shortener!</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationLink}">${verificationLink}</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Handle OPTIONS preflight requests explicitly
app.options('*', cors(corsOptions));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Session storage
const activeSessions = {}; // { sessionKey: { userId, expires } }

// Session expiration time in milliseconds (24 hours)
const SESSION_EXPIRATION = 24 * 60 * 60 * 1000;

// Encryption functions
function encryptPassword(password) {
  // Use a random initialization vector for better security
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(process.env.DECODE_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return both the IV and encrypted password
  return iv.toString('hex') + ':' + encrypted;
}

function decryptPassword(encryptedPassword) {
  // Split the IV and encrypted parts
  const parts = encryptedPassword.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const key = crypto.scryptSync(process.env.DECODE_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Generate a random session key
function generateSessionKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Middleware to verify session
function authenticateSession(req, res, next) {
  const sessionKey = req.headers.authorization;
  
  if (!sessionKey || !activeSessions[sessionKey]) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
  }
  
  const session = activeSessions[sessionKey];
  
  // Check if session has expired
  if (session.expires < Date.now()) {
    delete activeSessions[sessionKey];
    return res.status(401).json({ error: 'Unauthorized: Session expired' });
  }
  
  // Add userId to request for use in route handlers
  req.userId = session.userId;
  
  // Extend session expiration
  session.expires = Date.now() + SESSION_EXPIRATION;
  
  next();
}

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(activeSessions).forEach(key => {
    if (activeSessions[key].expires < now) {
      delete activeSessions[key];
    }
  });
}, 60 * 60 * 1000); // Clean up every hour

// Root route
app.get('/', (req, res) => {
  res.send('URL Shortener API is running');
});

// Signup route
app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    // Generate verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    // Encrypt password
    const encryptedPassword = encryptPassword(password);
    
    // Insert new user with verification token
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        password: encryptedPassword,
        created_at: new Date(),
        verification_token: verificationToken,
        token_expiry: tokenExpiry,
        is_verified: false
      })
      .select();
    
    if (error) throw error;
    
    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationToken);
    
    if (!emailSent) {
      // If email fails to send, delete the user
      await supabase
        .from('users')
        .delete()
        .eq('id', data[0].id);
      
      return res.status(500).json({ error: 'Failed to send verification email' });
    }
    
    // Return user data without sensitive information
    const userData = { ...data[0] };
    delete userData.password;
    delete userData.verification_token;
    delete userData.token_expiry;
    
    res.status(201).json({
      ...userData,
      message: 'Please check your email to verify your account'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify email route
app.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find user with matching token
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (error) throw error;
    
    if (!user) {
      return res.status(404).json({ error: 'Invalid verification token' });
    }
    
    // Check if token has expired
    if (new Date(user.token_expiry) < new Date()) {
      return res.status(400).json({ error: 'Verification token has expired' });
    }
    
    // Update user verification status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_verified: true,
        verification_token: null,
        token_expiry: null
      })
      .eq('id', user.id);
    
    if (updateError) throw updateError;
    
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Get user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (error) throw error;
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if email is verified
    if (!user.is_verified) {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in',
        message: 'Check your email for the verification link'
      });
    }
    
    // Decrypt stored password and compare
    const decryptedPassword = decryptPassword(user.password);
    
    if (password !== decryptedPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate session key
    const sessionKey = generateSessionKey();
    activeSessions[sessionKey] = {
      userId: user.id,
      expires: Date.now() + SESSION_EXPIRATION
    };
    
    // Return user data without password
    const userData = { ...user };
    delete userData.password;
    delete userData.verification_token;
    delete userData.token_expiry;
    
    res.status(200).json({
      user: userData,
      sessionKey,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Forgot password route
app.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Get user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (error) throw error;
    
    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return res.status(200).json({ 
        message: 'If an account exists with this email, you will receive password reset instructions.' 
      });
    }
    
    // Generate reset token
    const resetToken = generateVerificationToken();
    const tokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour from now
    
    // Update user with reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expiry: tokenExpiry
      })
      .eq('id', user.id);
    
    if (updateError) throw updateError;
    
    // Send reset email
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.GMAIL,
      to: email,
      subject: 'Reset Your Password - URL Shortener',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ 
        message: 'If an account exists with this email, you will receive password reset instructions.' 
      });
    } catch (error) {
      console.error('Error sending reset email:', error);
      res.status(500).json({ error: 'Failed to send reset email' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reset password route
app.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }
    
    // Find user with matching token
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('reset_token', token)
      .single();
    
    if (error) throw error;
    
    if (!user) {
      return res.status(404).json({ error: 'Invalid reset token' });
    }
    
    // Compare the expiry with current time directly
    const expiry = new Date(user.reset_token_expiry);
    const now = new Date();
    expiry.setHours(expiry.getHours() + 23); // Add 1 hour
    expiry.setMinutes(expiry.getMinutes() + 59); // Add 1 hour
    expiry.setSeconds(expiry.getSeconds() + 59); // Add 1 hour

    if (now > expiry) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }
    
    // Encrypt new password
    const encryptedPassword = encryptPassword(password);
    
    // Update user password and clear reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: encryptedPassword,
        reset_token: null,
        reset_token_expiry: null
      })
      .eq('id', user.id);
    
    if (updateError) throw updateError;
    
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Logout route
app.post('/logout', authenticateSession, (req, res) => {
  const sessionKey = req.headers.authorization;
  
  // Delete the session
  delete activeSessions[sessionKey];
  
  res.status(200).json({ message: 'Logged out successfully' });
});

// GET all users
app.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) throw error;
    
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET user by id
app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new user
app.post('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update user
app.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('users')
      .update(req.body)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE user
app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all links
app.get('/links', authenticateSession, async (req, res) => {
  try {
    // find user id from active sessions
    const userId = activeSessions[req.headers.authorization].userId;

    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Link not found' });
    }
    // Only update the counter after we've confirmed the link exists
  
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET link by alias
app.post('/links-alias/:alias', async (req, res) => {
  try {
    const { alias } = req.params;
    const { ip } = req.body;
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('alias', alias)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Link not found' });
    }

    let access_log = [...data.access_log, {
      ip: ip,
      user_agent: req.headers['user-agent'],
      timestamp: new Date()
    }];
    
    // Only update the counter after we've confirmed the link exists
    await supabase
      .from('links')
      .update({ accessed: (data.accessed || 0) + 1, access_log: access_log })
      .eq('id', data.id);
    
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new link
app.post('/links', authenticateSession, async (req, res) => {
  try {
    const userId = req.userId;
    const linkData = {
      ...req.body,
      user_id: userId,
      created_at: new Date()
    };
    
    const { data, error } = await supabase
      .from('links')
      .insert(linkData)
      .select();
    
    if (error) throw error;
    
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update link
app.patch('/links/:id', authenticateSession, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    // Check if the link belongs to the user
    const { data: linkData, error: linkError } = await supabase
      .from('links')
      .select('*')
      .eq('id', id)
      .single();
    
    if (linkError) throw linkError;

    if (!linkData) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    if (linkData.user_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to modify this link' });
    }
    
    // Update the link
    if (req.body == {}) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('links')
      .update(req.body)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'Link update failed' });
    }
    
    res.status(200).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE link
app.delete('/links/:id', authenticateSession, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    // Check if the link belongs to the user
    const { data: linkData, error: linkError } = await supabase
      .from('links')
      .select('*')
      .eq('id', id)
      .single();
    
    if (linkError) throw linkError;
    
    if (!linkData) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    if (linkData.user_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this link' });
    }
    
    // Delete the link
    const { error } = await supabase
      .from('links')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user's links
app.post('/get-links', authenticateSession, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get all links for this user
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Get links error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check session status
app.get('/session', authenticateSession, (req, res) => {
  res.status(200).json({ 
    authenticated: true,
    userId: req.userId
  });
});

// Create a shortened link
app.post('/create-link', authenticateSession, async (req, res) => {
  try {
    const userId = req.userId;
    const { url, custom_alias } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Generate an alias if custom_alias is not provided
    const alias = custom_alias || generateShortUrl();
    
    // Check if the alias already exists
    if (custom_alias) {
      const { data: existingLink, error: checkError } = await supabase
        .from('links')
        .select('*')
        .eq('alias', custom_alias)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (existingLink) {
        return res.status(409).json({ error: 'This custom alias is already in use' });
      }
    }
    
    // Create the link
    const linkData = {
      user_id: userId,
      url: url,
      alias: alias,
      created_at: new Date(),
      accessed: 0
    };
    
    const { data, error } = await supabase
      .from('links')
      .insert(linkData)
      .select();
    
    if (error) throw error;
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Create link error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate a random short URL
function generateShortUrl() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 6;
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}


// Get link statistics
app.get('/link-stats/:alias', authenticateSession, async (req, res) => {
  try {
    const { alias } = req.params;
    const userId = req.userId;
    
    // Find the link
    const { data: link, error } = await supabase
      .from('links')
      .select('*')
      .eq('alias', alias)
      .single();
    
    if (error) throw error;
    
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    // Check if the link belongs to the user
    if (link.user_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to view statistics for this link' });
    }
    
    res.status(200).json({
      id: link.id,
      url: link.url,
      alias: link.alias,
      accessed: link.accessed || 0,
      created_at: link.created_at
    });
  } catch (error) {
    console.error('Link stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
