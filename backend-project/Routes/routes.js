const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controller/userController');
const carController = require('../controller/carController');
const parkingSlotController = require('../controller/parkingSlotController');
const parkingRecordController = require('../controller/parkingRecordController');
const paymentController = require('../controller/paymentController');
// Change password (authenticated)
router.put('/api/change-password', auth, userController.changePassword);

// Auth routes
router.post('/api/register', userController.register);
router.post('/api/login', userController.login);
router.post('/api/forgot-password', userController.forgotPassword);
router.post('/api/verify-answers', userController.verifyAnswers);
router.post('/api/reset-password', userController.resetPassword);

// Car routes (INSERT + SELECT only)
router.post('/api/cars', auth, carController.createCar);
router.get('/api/cars', auth, carController.getAllCars);

// ParkingSlot routes (INSERT + SELECT only)
router.post('/api/slots', auth, parkingSlotController.createSlot);
router.get('/api/slots', auth, parkingSlotController.getAllSlots);

// ParkingRecord routes (full CRUD)
router.post('/api/records', auth, parkingRecordController.createRecord);
router.get('/api/records', auth, parkingRecordController.getAllRecords);
router.get('/api/records/:id', auth, parkingRecordController.getRecordById);
router.put('/api/records/:id', auth, parkingRecordController.updateRecord);
router.delete('/api/records/:id', auth, parkingRecordController.deleteRecord);

// Payment routes (INSERT + SELECT only)
router.post('/api/payments', auth, paymentController.createPayment);
router.get('/api/payments', auth, paymentController.getAllPayments);

module.exports = router;
