const db = require('../Config/db');

const pad = (n) => String(n).padStart(2, '0');
const localNow = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

exports.createRecord = (req, res) => {
    const { SlotNumber, plateNumber, User_ID, EntryTime } = req.body;
    if (!SlotNumber || !plateNumber || !User_ID) return res.status(400).json({ message: 'SlotNumber, plateNumber, User_ID required' });

    db.query('SELECT SlotStatus FROM ParkingSlot WHERE SlotNumber = ?', [SlotNumber], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (rows.length === 0) return res.status(404).json({ message: `Slot "${SlotNumber}" does not exist` });
        if (rows[0].SlotStatus === 'occupied') return res.status(409).json({ message: `Slot "${SlotNumber}" is already occupied` });

        db.query('SELECT P_ID FROM ParkingRecord WHERE plateNumber = ? AND ExitTime IS NULL', [plateNumber], (err, active) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            if (active.length > 0) return res.status(409).json({ message: `Car "${plateNumber}" is already parked in slot ${active[0].P_ID}` });

            db.query('SELECT User_ID FROM Users WHERE User_ID = ?', [User_ID], (err, userRows) => {
                if (err) return res.status(500).json({ message: 'Database error' });
                if (userRows.length === 0) return res.status(404).json({ message: 'User not found' });

                db.query('SELECT plateNumber FROM Car WHERE plateNumber = ?', [plateNumber], (err, carRows) => {
                    if (err) return res.status(500).json({ message: 'Database error' });
                    if (carRows.length === 0) return res.status(404).json({ message: `Car "${plateNumber}" not registered` });

                    const entryTime = EntryTime || localNow();
                    const sql = 'INSERT INTO ParkingRecord (SlotNumber, plateNumber, User_ID, EntryTime) VALUES (?, ?, ?, ?)';
                    db.query(sql, [SlotNumber, plateNumber, User_ID, entryTime], (err, result) => {
                        if (err?.errno === 1062) return res.status(409).json({ message: 'Duplicate entry' });
                        if (err) return res.status(500).json({ message: 'Failed to create record' });

                        db.query('UPDATE ParkingSlot SET SlotStatus = ? WHERE SlotNumber = ?', ['occupied', SlotNumber], (err2) => {
                            if (err2) {
                                db.query('DELETE FROM ParkingRecord WHERE P_ID = ?', [result.insertId]);
                                return res.status(500).json({ message: 'Failed to update slot status' });
                            }
                            res.status(201).json({ message: 'Parking record created', P_ID: result.insertId });
                        });
                    });
                });
            });
        });
    });
};

exports.getAllRecords = (req, res) => {
    const sql = `SELECT pr.*, c.DriverName, u.Name AS UserName, p.AmountPaid 
                 FROM ParkingRecord pr
                 LEFT JOIN Car c ON pr.plateNumber = c.plateNumber
                 LEFT JOIN Users u ON pr.User_ID = u.User_ID
                 LEFT JOIN Payment p ON pr.Pay_ID = p.Pay_ID
                 ORDER BY pr.EntryTime DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch records' });
        res.json(results);
    });
};

exports.getRecordById = (req, res) => {
    const sql = `SELECT pr.*, c.DriverName, u.Name AS UserName, p.AmountPaid 
                 FROM ParkingRecord pr
                 LEFT JOIN Car c ON pr.plateNumber = c.plateNumber
                 LEFT JOIN Users u ON pr.User_ID = u.User_ID
                 LEFT JOIN Payment p ON pr.Pay_ID = p.Pay_ID
                 WHERE pr.P_ID = ?`;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch record' });
        if (results.length === 0) return res.status(404).json({ message: 'Record not found' });
        res.json(results[0]);
    });
};

exports.updateRecord = (req, res) => {
    const { SlotNumber, plateNumber, User_ID, EntryTime, ExitTime, Pay_ID } = req.body;
    const { id } = req.params;

    let fields = [];
    let values = [];
    let timeChanged = false;

    if (SlotNumber) { fields.push('SlotNumber = ?'); values.push(SlotNumber); }
    if (plateNumber) { fields.push('plateNumber = ?'); values.push(plateNumber); }
    if (User_ID) { fields.push('User_ID = ?'); values.push(User_ID); }
    if (EntryTime) { fields.push('EntryTime = ?'); values.push(EntryTime); timeChanged = true; }
    if (ExitTime) { fields.push('ExitTime = ?'); values.push(ExitTime); timeChanged = true; }
    if (Pay_ID !== undefined) { fields.push('Pay_ID = ?'); values.push(Pay_ID); }

    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });

    if (EntryTime && ExitTime && new Date(ExitTime) <= new Date(EntryTime)) {
        return res.status(400).json({ message: 'ExitTime must be after EntryTime' });
    }

    if (timeChanged) {
        fields.push('Duration = TIMESTAMPDIFF(MINUTE, EntryTime, COALESCE(ExitTime, NOW()))');
    }

    values.push(id);

    const sql = `UPDATE ParkingRecord SET ${fields.join(', ')} WHERE P_ID = ?`;
    db.query(sql, values, (err, result) => {
        if (err?.errno === 1062) return res.status(409).json({ message: 'Duplicate entry' });
        if (err) return res.status(500).json({ message: 'Failed to update record' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Record not found' });

        if (ExitTime) {
            db.query('SELECT SlotNumber FROM ParkingRecord WHERE P_ID = ?', [id], (err2, rows) => {
                if (!err2 && rows.length > 0) {
                    db.query('UPDATE ParkingSlot SET SlotStatus = ? WHERE SlotNumber = ?', ['available', rows[0].SlotNumber]);
                }
            });
        }
        res.json({ message: 'Record updated' });
    });
};

exports.deleteRecord = (req, res) => {
    const { id } = req.params;
    db.query('SELECT SlotNumber FROM ParkingRecord WHERE P_ID = ?', [id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (rows.length === 0) return res.status(404).json({ message: 'Record not found' });

        db.query('DELETE FROM ParkingRecord WHERE P_ID = ?', [id], (err2, result) => {
            if (err2) return res.status(500).json({ message: 'Failed to delete record' });
            db.query('UPDATE ParkingSlot SET SlotStatus = ? WHERE SlotNumber = ?', ['available', rows[0].SlotNumber]);
            res.json({ message: 'Record deleted' });
        });
    });
};
