const db = require('../Config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const isStrongPassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('One number');
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('One special character');
    return errors;
};

exports.register = (req, res) => {
    const { Name, Email, Password, Role, SecurityQ1, SecurityQ2, Answer1, Answer2 } = req.body;
    if (!Name || !Email || !Password) return res.status(400).json({ message: 'All fields required' });
    if (!SecurityQ1 || !SecurityQ2 || !Answer1 || !Answer2) return res.status(400).json({ message: 'Two security questions and answers required' });

    const pwdErrors = isStrongPassword(Password);
    if (pwdErrors.length > 0) return res.status(400).json({ message: 'Weak password', details: pwdErrors });

    bcrypt.hash(Password, 10, (err, hash) => {
        if (err) return res.status(500).json({ message: 'Hashing error' });
        const sql = 'INSERT INTO Users (Name, Email, Password, Role) VALUES (?, ?, ?, ?)';
        db.query(sql, [Name, Email, hash, Role || 'staff'], (err, result) => {
            if (err?.errno === 1062) return res.status(409).json({ message: 'Email already registered' });
            if (err) return res.status(500).json({ message: 'Registration failed' });

            const userId = result.insertId;
            bcrypt.hash(Answer1.toLowerCase().trim(), 10, (err1, h1) => {
                bcrypt.hash(Answer2.toLowerCase().trim(), 10, (err2, h2) => {
                    if (err1 || err2) return res.status(500).json({ message: 'Error processing answers' });
                    const ansSql = 'INSERT INTO UserSecurityQA (User_ID, QuestionText, AnswerHash) VALUES (?, ?, ?), (?, ?, ?)';
                    db.query(ansSql, [userId, SecurityQ1, h1, userId, SecurityQ2, h2], (err3) => {
                        if (err3) {
                            console.error('SecurityAnswerInsertError:', err3);
                            return res.status(500).json({ message: 'Failed to save security answers', error: err3.message });
                        }
                        res.status(201).json({ message: 'User registered', User_ID: userId });
                    });
                });
            });
        });
    });
};

exports.login = (req, res) => {
    const { Email, Password } = req.body;
    if (!Email || !Password) return res.status(400).json({ message: 'Email and password required' });

    const sql = 'SELECT * FROM Users WHERE Email = ?';
    db.query(sql, [Email], (err, results) => {
        if (err) return res.status(500).json({ message: 'Login error' });
        if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const user = results[0];
        bcrypt.compare(Password, user.Password, (err, match) => {
            if (err) return res.status(500).json({ message: 'Comparison error' });
            if (!match) return res.status(401).json({ message: 'Invalid credentials' });

            const token = jwt.sign(
                { id: user.User_ID, name: user.Name, email: user.Email, role: user.Role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            res.json({ message: 'Login successful', token, user: { id: user.User_ID, name: user.Name, email: user.Email, role: user.Role } });
        });
    });
};

exports.forgotPassword = (req, res) => {
    const { Email } = req.body;
    if (!Email) return res.status(400).json({ message: 'Email required' });

    db.query('SELECT User_ID FROM Users WHERE Email = ?', [Email], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results.length === 0) return res.status(404).json({ message: 'No account with that email' });

        const userId = results[0].User_ID;
        db.query('SELECT UA_ID, QuestionText FROM UserSecurityQA WHERE User_ID = ? ORDER BY UA_ID', [userId], (err2, questions) => {
            if (err2) return res.status(500).json({ message: 'Database error' });
            if (questions.length !== 2) return res.status(500).json({ message: 'Security questions not found' });
            res.json({ message: 'Answer your security questions', questions });
        });
    });
};

exports.verifyAnswers = (req, res) => {
    const { Email, Answers } = req.body;
    if (!Email || !Answers || !Array.isArray(Answers) || Answers.length !== 2) {
        return res.status(400).json({ message: 'Email and 2 answers required' });
    }

    db.query('SELECT User_ID FROM Users WHERE Email = ?', [Email], (err, users) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (users.length === 0) return res.status(404).json({ message: 'No account with that email' });

        const userId = users[0].User_ID;
        db.query('SELECT UA_ID, AnswerHash FROM UserSecurityQA WHERE User_ID = ? ORDER BY UA_ID', [userId], (err2, rows) => {
            if (err2) return res.status(500).json({ message: 'Database error' });
            if (rows.length !== 2) return res.status(500).json({ message: 'Security questions not found' });

            bcrypt.compare(Answers[0].toLowerCase().trim(), rows[0].AnswerHash, (err3, match1) => {
                bcrypt.compare(Answers[1].toLowerCase().trim(), rows[1].AnswerHash, (err4, match2) => {
                    if (err3 || err4) return res.status(500).json({ message: 'Verification error' });
                    if (!match1 || !match2) return res.status(401).json({ message: 'Incorrect answers' });
                    res.json({ message: 'Answers verified', verified: true });
                });
            });
        });
    });
};

exports.changePassword = (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Current and new password required' });

    const pwdErrors = isStrongPassword(newPassword);
    if (pwdErrors.length > 0) return res.status(400).json({ message: 'Weak password', details: pwdErrors });

    db.query('SELECT Password FROM Users WHERE User_ID = ?', [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });

        bcrypt.compare(oldPassword, results[0].Password, (err2, match) => {
            if (err2) return res.status(500).json({ message: 'Comparison error' });
            if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

            bcrypt.hash(newPassword, 10, (err3, hash) => {
                if (err3) return res.status(500).json({ message: 'Hashing error' });
                db.query('UPDATE Users SET Password = ? WHERE User_ID = ?', [hash, req.user.id], (err4) => {
                    if (err4) return res.status(500).json({ message: 'Failed to update password' });
                    res.json({ message: 'Password changed successfully' });
                });
            });
        });
    });
};

exports.resetPassword = (req, res) => {
    const { Email, NewPassword } = req.body;
    if (!Email || !NewPassword) return res.status(400).json({ message: 'Email and new password required' });

    const pwdErrors = isStrongPassword(NewPassword);
    if (pwdErrors.length > 0) return res.status(400).json({ message: 'Weak password', details: pwdErrors });

    bcrypt.hash(NewPassword, 10, (err, hash) => {
        if (err) return res.status(500).json({ message: 'Hashing error' });
        db.query('UPDATE Users SET Password = ? WHERE Email = ?', [hash, Email], (err2) => {
            if (err2) return res.status(500).json({ message: 'Failed to reset password' });
            res.json({ message: 'Password reset successfully. Please login.' });
        });
    });
};
