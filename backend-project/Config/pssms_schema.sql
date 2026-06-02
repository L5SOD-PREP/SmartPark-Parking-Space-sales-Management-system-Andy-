CREATE DATABASE IF NOT EXISTS PSSMS;
USE PSSMS;

-- Users table
CREATE TABLE Users (
    User_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Role ENUM('admin', 'staff') DEFAULT 'staff',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ParkingSlot table
CREATE TABLE ParkingSlot (
    SlotNumber VARCHAR(20) PRIMARY KEY,
    SlotStatus ENUM('available', 'occupied', 'reserved', 'disabled') DEFAULT 'available'
);

-- Car table
CREATE TABLE Car (
    plateNumber VARCHAR(20) PRIMARY KEY,
    DriverName VARCHAR(100) NOT NULL,
    phoneNumber VARCHAR(20) NOT NULL
);

-- Payment table (FKs to Car and ParkingSlot)
CREATE TABLE Payment (
    Pay_ID INT AUTO_INCREMENT PRIMARY KEY,
    plateNumber VARCHAR(20) NOT NULL,
    SlotNumber VARCHAR(20) NOT NULL,
    AmountPaid DECIMAL(10,2) NOT NULL,
    PaymentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plateNumber) REFERENCES Car(plateNumber) ON DELETE CASCADE,
    FOREIGN KEY (SlotNumber) REFERENCES ParkingSlot(SlotNumber) ON DELETE CASCADE
);

-- ParkingRecord table (tracks parking sessions)
CREATE TABLE ParkingRecord (
    P_ID INT AUTO_INCREMENT PRIMARY KEY,
    SlotNumber VARCHAR(20) NOT NULL,
    plateNumber VARCHAR(20) NOT NULL,
    User_ID INT NOT NULL,
    Pay_ID INT,
    EntryTime DATETIME NOT NULL,
    ExitTime DATETIME,
    Duration INT DEFAULT NULL,
    FOREIGN KEY (SlotNumber) REFERENCES ParkingSlot(SlotNumber) ON DELETE CASCADE,
    FOREIGN KEY (plateNumber) REFERENCES Car(plateNumber) ON DELETE CASCADE,
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE,
    FOREIGN KEY (Pay_ID) REFERENCES Payment(Pay_ID) ON DELETE SET NULL
);

-- User Security Q&A table (stores question + answer hash together)
CREATE TABLE UserSecurityQA (
    UA_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL,
    QuestionText VARCHAR(255) NOT NULL,
    AnswerHash VARCHAR(255) NOT NULL,
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE
);
