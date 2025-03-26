const express = require("express")
const mongoose = require("mongoose")
require("dotenv").config();
const bcrypt = require("bcryptjs")
const path = require("path")
const User = require("./models/userModel")

const app = express()
const PORT = 3000

// Add this debugging middleware at the top of your middleware section
// to log all incoming requests

// Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})
app.use(express.json())
const cors = require("cors");
app.use(cors());

app.use(express.static(path.join(__dirname, "public")))

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Also update the signup route with better error handling
app.post("/signup", async (req, res) => {
  try {
    console.log("Signup request received:", {
      ...req.body,
      password: req.body.password ? "********" : undefined,
    })

    const { fullName, username, email, password } = req.body

    // Validate required fields
    if (!fullName || !username || !email || !password) {
      console.log("Missing required fields")
      return res.status(400).json({
        error: "All fields are required",
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      console.log("User already exists:", existingUser.email)
      return res.status(400).json({
        error: "User with this email or username already exists",
      })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create new user
    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
    })

    await newUser.save()
    console.log("User registered successfully:", username)
    res.status(201).json({ success: true, message: "User registered successfully" })
  } catch (error) {
    console.error("Signup error details:", error)
    res.status(500).json({
      error: "Server error, please try again",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Login Route
app.post("/login", async (req, res) => {
  try {
    console.log("Login request received:", req.body)
    const { email, password } = req.body

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ error: "Invalid email or passwor`d" })
    }
``
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" })
    }

    // Login successful
    console.log("User logged in successfully:", email)
    res.status(200).json({ success: true, message: "Login successful" })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Server error, please try again" })
  }
})

// Serve HTML pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"))
})

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"))
})

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"))
})

app.get("/dashboard", (req, res) => {
  res.send("Welcome to your dashboard!")
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

