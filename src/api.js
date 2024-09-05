const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const serverless = require("serverless-http");

const app = express();
const router = express.Router();

// Create MySQL connection pool
const pool = mysql.createPool({
	host: "localhost",
	user: "root",
	password: "root",
	database: "Car_rental",
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

const promisePool = pool.promise();

app.use(cors());
app.use(express.json());

// GET all cars
router.get("/cars", async (req, res) => {
	try {
		const [rows] = await promisePool.query("SELECT * FROM Cars");
		res.json(rows);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// GET a specific car by ID
router.get("/cars/:id", async (req, res) => {
	const carId = parseInt(req.params.id, 10);
	if (isNaN(carId)) {
		return res.status(400).json({ error: "Invalid car ID" });
	}
	try {
		const [rows] = await promisePool.query(
			"SELECT * FROM Cars WHERE CarID = ?",
			[carId]
		);
		if (rows.length === 0) {
			return res.status(404).json({ error: "Car not found" });
		}
		res.json(rows[0]);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// POST a new car
router.post("/cars", async (req, res) => {
	const {
		Make,
		Model,
		Year,
		Color,
		LicensePlate,
		DailyRate,
		Status,
		ImageURL,
	} = req.body;

	if (
		typeof Make !== "string" ||
		typeof Model !== "string" ||
		typeof Year !== "number" ||
		typeof Color !== "string" ||
		typeof LicensePlate !== "string" ||
		typeof DailyRate !== "number" ||
		!["Available", "Rented", "Maintenance"].includes(Status) ||
		typeof ImageURL !== "string"
	) {
		return res.status(400).json({ error: "Invalid input" });
	}

	try {
		const [result] = await promisePool.query(
			"INSERT INTO Cars (Make, Model, Year, Color, LicensePlate, DailyRate, Status, ImageURL) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			[
				Make,
				Model,
				Year,
				Color,
				LicensePlate,
				DailyRate,
				Status,
				ImageURL,
			]
		);
		res.status(201).json({
			CarID: result.insertId,
			Make,
			Model,
			Year,
			Color,
			LicensePlate,
			DailyRate,
			Status,
			ImageURL,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// PUT (Update) a car
router.put("/cars/:id", async (req, res) => {
	const carId = parseInt(req.params.id, 10);
	const {
		Make,
		Model,
		Year,
		Color,
		LicensePlate,
		DailyRate,
		Status,
		ImageURL,
	} = req.body;

	if (
		isNaN(carId) ||
		typeof Make !== "string" ||
		typeof Model !== "string" ||
		typeof Year !== "number" ||
		typeof Color !== "string" ||
		typeof LicensePlate !== "string" ||
		typeof DailyRate !== "number" ||
		!["Available", "Rented", "Maintenance"].includes(Status) ||
		typeof ImageURL !== "string"
	) {
		return res.status(400).json({ error: "Invalid input" });
	}

	try {
		const [result] = await promisePool.query(
			"UPDATE Cars SET Make = ?, Model = ?, Year = ?, Color = ?, LicensePlate = ?, DailyRate = ?, Status = ?, ImageURL = ? WHERE CarID = ?",
			[
				Make,
				Model,
				Year,
				Color,
				LicensePlate,
				DailyRate,
				Status,
				ImageURL,
				carId,
			]
		);
		if (result.affectedRows === 0) {
			return res.status(404).json({ error: "Car not found" });
		}
		res.json({
			CarID: carId,
			Make,
			Model,
			Year,
			Color,
			LicensePlate,
			DailyRate,
			Status,
			ImageURL,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// DELETE a car
router.delete("/cars/:id", async (req, res) => {
	const carId = parseInt(req.params.id, 10);

	if (isNaN(carId)) {
		return res.status(400).json({ error: "Invalid car ID" });
	}

	try {
		const [result] = await promisePool.query(
			"DELETE FROM Cars WHERE CarID = ?",
			[carId]
		);
		if (result.affectedRows === 0) {
			return res.status(404).json({ error: "Car not found" });
		}

		// Optionally, return remaining cars or a success message
		const [rows] = await promisePool.query("SELECT * FROM Cars");
		res.json(rows);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// GET all rentals
router.get("/rentals", async (req, res) => {
	try {
		const [rows] = await promisePool.query("SELECT * FROM Rentals");
		res.json(rows);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// GET rentals by userId
router.get("/rentals/user/:userId", async (req, res) => {
	const userId = parseInt(req.params.userId, 10);
	if (isNaN(userId)) {
		return res.status(400).json({ error: "Invalid user ID" });
	}
	try {
		const [rows] = await promisePool.query(
			"SELECT * FROM Rentals WHERE UserID = ?",
			[userId]
		);
		res.json(rows);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// POST a new rental
router.post("/rentals", async (req, res) => {
	const { CarID, UserID, StartDate, EndDate, TotalAmount } = req.body;

	if (
		typeof CarID !== "number" ||
		typeof UserID !== "number" ||
		typeof StartDate !== "string" ||
		(EndDate && typeof EndDate !== "string") ||
		typeof TotalAmount !== "number"
	) {
		return res.status(400).json({ error: "Invalid input" });
	}

	try {
		const [result] = await promisePool.query(
			"INSERT INTO Rentals (CarID, UserID, StartDate, EndDate, TotalAmount) VALUES (?, ?, ?, ?, ?)",
			[CarID, UserID, StartDate, EndDate, TotalAmount]
		);
		res.status(201).json({
			RentalID: result.insertId,
			CarID,
			UserID,
			StartDate,
			EndDate,
			TotalAmount,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// PUT (Update) a rental
router.put("/rentals/:id", async (req, res) => {
	const rentalId = parseInt(req.params.id, 10);
	const { CarID, UserID, StartDate, EndDate, TotalAmount } = req.body;

	if (
		isNaN(rentalId) ||
		typeof CarID !== "number" ||
		typeof UserID !== "number" ||
		typeof StartDate !== "string" ||
		(EndDate && typeof EndDate !== "string") ||
		typeof TotalAmount !== "number"
	) {
		return res.status(400).json({ error: "Invalid input" });
	}

	try {
		const [result] = await promisePool.query(
			"UPDATE Rentals SET CarID = ?, UserID = ?, StartDate = ?, EndDate = ?, TotalAmount = ? WHERE RentalID = ?",
			[CarID, UserID, StartDate, EndDate, TotalAmount, rentalId]
		);
		if (result.affectedRows === 0) {
			return res.status(404).json({ error: "Rental not found" });
		}
		res.json({
			RentalID: rentalId,
			CarID,
			UserID,
			StartDate,
			EndDate,
			TotalAmount,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// DELETE a rental
router.delete("/rentals/:id", async (req, res) => {
	const rentalId = parseInt(req.params.id, 10);

	if (isNaN(rentalId)) {
		return res.status(400).json({ error: "Invalid rental ID" });
	}

	try {
		const [result] = await promisePool.query(
			"DELETE FROM Rentals WHERE RentalID = ?",
			[rentalId]
		);
		if (result.affectedRows === 0) {
			return res.status(404).json({ error: "Rental not found" });
		}

		const [rows] = await promisePool.query("SELECT * FROM Rentals");
		res.json(rows);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});
// GET all users
router.get("/users", async (req, res) => {
	try {
		const [rows] = await promisePool.query("SELECT * FROM Users");
		res.json(rows);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});
// GET a specific user by ID
router.get("/users/:id", async (req, res) => {
	const userId = parseInt(req.params.id, 10);
	if (isNaN(userId)) {
		return res.status(400).json({ error: "Invalid user ID" });
	}
	try {
		const [rows] = await promisePool.query(
			"SELECT * FROM Users WHERE UserID = ?",
			[userId]
		);
		if (rows.length === 0) {
			return res.status(404).json({ error: "User not found" });
		}
		res.json(rows[0]);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});
// POST a new user
router.post("/users", async (req, res) => {
	const { Name, Email, Password } = req.body;

	if (
		typeof Name !== "string" ||
		typeof Email !== "string" ||
		typeof Password !== "string"
	) {
		return res.status(400).json({ error: "Invalid input" });
	}

	try {
		const [result] = await promisePool.query(
			"INSERT INTO Users (Name, Email, Password) VALUES (?, ?, ?)",
			[Name, Email, Password]
		);
		res.status(201).json({
			UserID: result.insertId,
			Name,
			Email,
			Password,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});
// PUT (Update) a user
router.put("/users/:id", async (req, res) => {
	const userId = parseInt(req.params.id, 10);
	const { Name, Email, Password } = req.body;

	if (
		isNaN(userId) ||
		typeof Name !== "string" ||
		typeof Email !== "string" ||
		typeof Password !== "string"
	) {
		return res.status(400).json({ error: "Invalid input" });
	}

	try {
		const [result] = await promisePool.query(
			"UPDATE Users SET Name = ?, Email = ?, Password = ? WHERE UserID = ?",
			[Name, Email, Password, userId]
		);
		if (result.affectedRows === 0) {
			return res.status(404).json({ error: "User not found" });
		}
		res.json({
			UserID: userId,
			Name,
			Email,
			Password,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});
// DELETE a user
router.delete("/users/:id", async (req, res) => {
	const userId = parseInt(req.params.id, 10);

	if (isNaN(userId)) {
		return res.status(400).json({ error: "Invalid user ID" });
	}

	try {
		const [result] = await promisePool.query(
			"DELETE FROM Users WHERE UserID = ?",
			[userId]
		);
		if (result.affectedRows === 0) {
			return res.status(404).json({ error: "User not found" });
		}

		// Optionally, return remaining users or a success message
		const [rows] = await promisePool.query("SELECT * FROM Users");
		res.json(rows);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

function handleShutdown(signal) {
	console.log(`Received ${signal}. Closing MySQL pool...`);
	pool.end((err) => {
		if (err) {
			console.error("Error closing MySQL pool:", err);
		} else {
			console.log("MySQL pool closed.");
		}
		process.exit();
	});
}

// Listen for termination signals
process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
app.use("/.netlify/functions/api", router);

module.exports.handler = serverless(app);
