const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const Score = require('./models/score');

mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/stickman-heist')
  .then(() => console.log('MongoDB connected')).catch(console.error);

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(session({ secret: process.env.SECRET || 'change-me', resave: false, saveUninitialized: false, cookie: { maxAge: 7 * 864e5 } }));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req, res, next) => { res.locals.user = req.user; res.locals.error = null; next(); });

const top = (n = 10) => Score.aggregate([
  { $group: { _id: '$username', best: { $max: '$total' }, plays: { $sum: 1 } } },
  { $sort: { best: -1 } }, { $limit: n }
]);

app.get('/', async (req, res) => res.render('index', { leaders: await top(5) }));
app.get('/leaderboard', async (req, res) => res.render('leaderboard', { leaders: await top(50) }));
app.get('/api/leaderboard', async (req, res) => res.json(await top(5)));

app.get('/signup', (req, res) => res.render('signup'));
app.post('/signup', async (req, res) => {
  try {
    const u = await User.register(new User({ username: req.body.username }), req.body.password);
    req.login(u, err => err ? res.render('signup', { error: err.message }) : res.redirect('/'));
  } catch (e) { res.render('signup', { error: e.message }); }
});
app.get('/login', (req, res) => res.render('login'));
app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user) => {
    if (err || !user) return res.render('login', { error: 'Wrong username or password.' });
    req.login(user, e => e ? next(e) : res.redirect('/'));
  })(req, res, next);
});
app.get('/logout', (req, res, next) => req.logout(e => e ? next(e) : res.redirect('/')));

// Guests can play; only logged-in players get their score saved.
app.post('/api/score', async (req, res) => {
  if (!req.user) return res.json({ saved: false });
  const total = Math.max(0, Math.min(2000, Number(req.body.total) || 0));
  const timeMs = Math.max(0, Number(req.body.timeMs) || 0);
  await Score.create({ username: req.user.username, total, timeMs, completed: !!req.body.completed, route: String(req.body.route || '') });
  res.json({ saved: true });
});

app.listen(process.env.PORT || 3000, () => console.log('http://localhost:3000'));
