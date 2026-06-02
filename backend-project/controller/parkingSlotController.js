const db = require('../Config/db');

exports.createSlot = (req, res) => {
    const { SlotNumber, SlotStatus } = req.body;
    if (!SlotNumber) return res.status(400).json({ message: 'SlotNumber required' });

    const sql = 'INSERT INTO ParkingSlot (SlotNumber, SlotStatus) VALUES (?, ?)';
    db.query(sql, [SlotNumber, SlotStatus || 'available'], (err, result) => {
        if (err?.errno === 1062) return res.status(409).json({ message: `Slot "${SlotNumber}" already exists` });
        if (err) return res.status(500).json({ message: 'Failed to add slot' });
        res.status(201).json({ message: 'Parking slot created', SlotNumber });
    });
};

exports.getAllSlots = (req, res) => {
    const sql = 'SELECT * FROM ParkingSlot ORDER BY SlotNumber';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch slots', error: err });
        res.json(results);
    });
};
