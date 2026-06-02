const db = require('../Config/db');

const pad = (n) => String(n).padStart(2, '0');
const localNow = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

exports.createPayment = (req, res) => {
    const { plateNumber, SlotNumber, AmountPaid } = req.body;
    if (!plateNumber || !SlotNumber || !AmountPaid) return res.status(400).json({ message: 'plateNumber, SlotNumber, AmountPaid required' });

    db.query('SELECT plateNumber FROM Car WHERE plateNumber = ?', [plateNumber], (err, carRows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (carRows.length === 0) return res.status(404).json({ message: `Car "${plateNumber}" not registered` });

        db.query('SELECT SlotNumber FROM ParkingSlot WHERE SlotNumber = ?', [SlotNumber], (err, slotRows) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            if (slotRows.length === 0) return res.status(404).json({ message: `Slot "${SlotNumber}" does not exist` });

            db.query('SELECT P_ID FROM ParkingRecord WHERE plateNumber = ? AND SlotNumber = ? AND ExitTime IS NULL', [plateNumber, SlotNumber], (err, recRows) => {
                if (err) return res.status(500).json({ message: 'Database error' });

                const sql = 'INSERT INTO Payment (plateNumber, SlotNumber, AmountPaid) VALUES (?, ?, ?)';
                db.query(sql, [plateNumber, SlotNumber, AmountPaid], (err, result) => {
                    if (err) return res.status(500).json({ message: 'Failed to process payment' });

                    const payId = result.insertId;

                    if (recRows.length > 0) {
                        const pId = recRows[0].P_ID;
                        const now = localNow();
                        db.query(
                            'UPDATE ParkingRecord SET ExitTime = ?, Pay_ID = ?, Duration = TIMESTAMPDIFF(MINUTE, EntryTime, ?) WHERE P_ID = ?',
                            [now, payId, now, pId],
                            (err2) => {
                                if (err2) return res.status(500).json({ message: 'Failed to checkout' });
                                db.query('UPDATE ParkingSlot SET SlotStatus = ? WHERE SlotNumber = ?', ['available', SlotNumber], (err3) => {
                                    if (err3) return res.status(500).json({ message: 'Failed to free slot' });
                                    res.status(201).json({ message: 'Payment recorded and vehicle checked out', Pay_ID: payId, P_ID: pId });
                                });
                            }
                        );
                    } else {
                        res.status(201).json({ message: 'Payment recorded', Pay_ID: payId, P_ID: null });
                    }
                });
            });
        });
    });
};

exports.getAllPayments = (req, res) => {
    const sql = `SELECT p.*, c.DriverName 
                 FROM Payment p
                 LEFT JOIN Car c ON p.plateNumber = c.plateNumber
                 ORDER BY p.PaymentDate DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch payments' });
        res.json(results);
    });
};
