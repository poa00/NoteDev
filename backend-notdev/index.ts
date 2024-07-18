import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import fetch from 'node-fetch';
import cookieParser from 'cookie-parser';
import User from './src/models/User';
import connectDB from './src/config/db';
import questionRoutes from './src/routes/questionRoutes';
import dsaTopicRoutes from './src/routes/dsaTopicRoutes';
import userRoutes from './src/routes/userRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors({
    origin: process.env.FRONTEND_URL, // Allow only your frontend URL
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());
app.use(cookieParser()); // Add cookie parser middleware

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:5000/auth/google/callback';

app.get('/auth/google', (req, res) => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=profile email`;
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Invalid code parameter' });
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error_description);
    }

    const accessToken = data.access_token;
    const expires_in = data.expires_in * 1000;

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const userData = await userResponse.json();

    const existingUser = await User.findOne({ uid: userData.id });
    if (!existingUser) {
      const newUser = new User({
        uid: userData.id,
        name: userData.name,
        email: userData.email,
        picture: userData.picture,
      });
      await newUser.save();
    }
    const expiryDate = new Date(Date.now() + expires_in);
    
    // Set cookies
    res.cookie('token', accessToken, { httpOnly: true, secure: true, expires: expiryDate });
    res.cookie('uid', userData.id, { httpOnly: true, secure: true, expires: expiryDate });

    res.redirect(`${process.env.FRONTEND_URL}/?token=${accessToken}&uid=${userData.id}`);
  } catch (err) {
    console.error('Error fetching access token:', err);
    res.status(500).json({ error: 'Failed to fetch access token' });
  }
});

app.get('/auth/user/profile', async (req, res) => {
  const token = req.cookies.token;
  console.log('Token:', token); // Log the token for debugging purposes

  if (!token) {
    return res.status(401).json({ error: 'Authorization token is missing' });
  }

  try {
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('Error response from Google API:', errorText); // Log the error response from Google API
      throw new Error('Failed to fetch user info');
    }

    const userData = await userResponse.json();
    res.json({ user: userData });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/questions', questionRoutes);
app.use('/api/topics', dsaTopicRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
