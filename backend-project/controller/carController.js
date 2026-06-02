const db = require('../Config/db');

exports.createCar = (req, res) => {
    const { plateNumber, DriverName, phoneNumber } = req.body;
    if (!plateNumber || !DriverName || !phoneNumber) return res.status(400).json({ message: 'All fields required' });

    const sql = 'INSERT INTO Car (plateNumber, DriverName, phoneNumber) VALUES (?, ?, ?)';
    db.query(sql, [plateNumber, DriverName, phoneNumber], (err, result) => {
        if (err?.errno === 1062) return res.status(409).json({ message: `Car with plate "${plateNumber}" already exists` });
        if (err) return res.status(500).json({ message: 'Failed to add car' });
        res.status(201).json({ message: 'Car added', plateNumber });
    });
};

exports.getAllCars = (req, res) => {
    const sql = 'SELECT * FROM Car ORDER BY DriverName';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch cars', error: err });
        res.json(results);
    });
};
