-- ============================================
-- TRAFFIC LAW EXAM SYSTEM - DATABASE SCHEMA
-- ============================================

CREATE DATABASE IF NOT EXISTS traffic_exam_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE traffic_exam_db;

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(150) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'student') DEFAULT 'student',
  preferred_language ENUM('en', 'rw', 'fr') DEFAULT 'en',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- QUESTION CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_en VARCHAR(150) NOT NULL,
  name_rw VARCHAR(150) NOT NULL,
  name_fr VARCHAR(150) NOT NULL,
  description_en TEXT,
  description_rw TEXT,
  description_fr TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QUESTIONS TABLE (trilingual)
CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT,
  question_en TEXT NOT NULL,
  question_rw TEXT NOT NULL,
  question_fr TEXT NOT NULL,
  image_url VARCHAR(500),
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ANSWER OPTIONS TABLE
CREATE TABLE IF NOT EXISTS answer_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  option_letter ENUM('A', 'B', 'C', 'D') NOT NULL,
  option_en TEXT NOT NULL,
  option_rw TEXT NOT NULL,
  option_fr TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
  currency VARCHAR(10) DEFAULT 'RWF',
  phone_number VARCHAR(20) NOT NULL,
  momo_reference_id VARCHAR(100) UNIQUE,
  momo_transaction_id VARCHAR(100),
  status ENUM('pending', 'successful', 'failed', 'cancelled') DEFAULT 'pending',
  failure_reason VARCHAR(255),
  initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- EXAMS TABLE
CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  payment_id INT,
  language ENUM('en', 'rw', 'fr') DEFAULT 'en',
  total_questions INT DEFAULT 20,
  correct_answers INT DEFAULT 0,
  score DECIMAL(5, 2) DEFAULT 0.00,
  pass_mark DECIMAL(5, 2) DEFAULT 70.00,
  passed BOOLEAN DEFAULT FALSE,
  status ENUM('pending', 'in_progress', 'completed', 'abandoned') DEFAULT 'pending',
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
);

-- EXAM QUESTIONS (the 20 questions picked for each exam)
CREATE TABLE IF NOT EXISTS exam_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  question_id INT NOT NULL,
  question_order INT NOT NULL,
  selected_option ENUM('A', 'B', 'C', 'D') NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  time_spent_seconds INT DEFAULT 0,
  answered_at TIMESTAMP NULL,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- DEFAULT SETTINGS
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('exam_price', '100', 'Price per exam in RWF'),
('exam_questions_count', '20', 'Number of questions per exam'),
('pass_mark', '70', 'Pass mark percentage'),
('momo_collection_subscription_key', 'YOUR_MOMO_SUBSCRIPTION_KEY', 'MTN MoMo Collection API Subscription Key'),
('momo_api_user_id', 'YOUR_API_USER_ID', 'MTN MoMo API User ID'),
('momo_api_key', 'YOUR_API_KEY', 'MTN MoMo API Key'),
('momo_environment', 'sandbox', 'MTN MoMo Environment: sandbox or production'),
('app_name_en', 'Rwanda Traffic Law Exam', 'App name in English'),
('app_name_rw', 'Ikizamini cy\'Amategeko y\'Umuhanda', 'App name in Kinyarwanda'),
('app_name_fr', 'Examen du Code de la Route', 'App name in French');

-- CATEGORIES SEED DATA
INSERT INTO categories (name_en, name_rw, name_fr, description_en, description_rw, description_fr) VALUES
('Traffic Signs', 'Ibimenyetso by\'Umuhanda', 'Panneaux de Signalisation', 'Questions about road signs', 'Ibibazo ku bimenyetso', 'Questions sur les panneaux'),
('Traffic Rules', 'Amategeko y\'Umuhanda', 'Règles de Circulation', 'Questions about traffic rules', 'Ibibazo ku mategeko', 'Questions sur les règles'),
('Road Safety', 'Umutekano ku Muhanda', 'Sécurité Routière', 'Questions about road safety', 'Ibibazo ku mutekano', 'Questions sur la sécurité'),
('Vehicle Mechanics', 'Imashini z\'Imodoka', 'Mécanique du Véhicule', 'Basic vehicle mechanics', 'Imashini z\'ibanze', 'Mécanique de base'),
('First Aid', 'Ubuvuzi bw\'Ibanze', 'Premiers Secours', 'First aid for road accidents', 'Ubuvuzi ku ngozi', 'Premiers secours accidents');

-- ADMIN USER (password: Admin@123)
INSERT INTO users (full_name, phone, email, password_hash, role) VALUES
('System Administrator', '0780000000', 'admin@trafficexam.rw', '$2b$10$rQ5hK3vX9mZ2pL8nE6dFOeU7RvKjMwB4cA1sNgYiT0uH3xJ6lP9qW', 'admin');

-- SAMPLE QUESTIONS
INSERT INTO questions (category_id, question_en, question_rw, question_fr, difficulty, created_by) VALUES
(2, 'What does a red traffic light mean?', 'Urumuri rutukura rw\'umuhanda rusobanura iki?', 'Que signifie un feu rouge?', 'easy', 1),
(2, 'What is the maximum speed limit in a residential area in Rwanda?', 'Iherezo ry\'umuvuduko mu kibuga mu Rwanda ni iki?', 'Quelle est la vitesse maximale en zone résidentielle au Rwanda?', 'easy', 1),
(1, 'What does a triangular road sign with a red border indicate?', 'Ikimenyetso gisa na tirangi gifite uruziga rutukura gisobanura iki?', 'Que signifie un panneau triangulaire à bordure rouge?', 'medium', 1),
(3, 'When should you use your hazard lights?', 'Ni ryari ugomba gukoresha amatara aburura?', 'Quand utiliser les feux de détresse?', 'medium', 1),
(3, 'What is the minimum following distance on a highway?', 'Intera nto hagati y\'imodoka ku muhanda w\'imbere ni iyihe?', 'Quelle est la distance de sécurité minimale sur autoroute?', 'medium', 1);

-- SAMPLE ANSWER OPTIONS
INSERT INTO answer_options (question_id, option_letter, option_en, option_rw, option_fr, is_correct) VALUES
-- Q1: Red light
(1, 'A', 'Stop completely', 'Hagarara burundu', 'Arrêt complet', TRUE),
(1, 'B', 'Slow down', 'Gabanya umuvuduko', 'Ralentir', FALSE),
(1, 'C', 'Proceed with caution', 'Komeza wifashije', 'Procéder avec prudence', FALSE),
(1, 'D', 'Yield to pedestrians only', 'Hagarara abantu gusa', 'Céder aux piétons seulement', FALSE),
-- Q2: Speed limit residential
(2, 'A', '60 km/h', '60 km/h', '60 km/h', FALSE),
(2, 'B', '40 km/h', '40 km/h', '40 km/h', TRUE),
(2, 'C', '80 km/h', '80 km/h', '80 km/h', FALSE),
(2, 'D', '50 km/h', '50 km/h', '50 km/h', FALSE),
-- Q3: Triangle sign
(3, 'A', 'Mandatory instruction', 'Itegeko rya ngombwa', 'Instruction obligatoire', FALSE),
(3, 'B', 'Warning/Danger ahead', 'Inzitizi/Akaga imbere', 'Avertissement/Danger', TRUE),
(3, 'C', 'Information sign', 'Ikimenyetso cy\'amakuru', 'Panneau d\'information', FALSE),
(3, 'D', 'Priority road', 'Inzira ya mbere', 'Route prioritaire', FALSE),
-- Q4: Hazard lights
(4, 'A', 'When parking illegally', 'Iyo uhagaritse nabi', 'En stationnement illégal', FALSE),
(4, 'B', 'When your vehicle is broken down or stationary in a dangerous position', 'Iyo imodoka yawe yananiwe cyangwa ihagaritse ahantu hatari', 'Quand votre véhicule est en panne ou immobilisé', TRUE),
(4, 'C', 'During heavy rain only', 'Iyo imvura igwa gusa', 'Par forte pluie seulement', FALSE),
(4, 'D', 'When driving at night', 'Iyo utwaye nijoro', 'En conduisant la nuit', FALSE),
-- Q5: Following distance
(5, 'A', '2 seconds rule', 'Amasekondi 2', '2 secondes', FALSE),
(5, 'B', '3 seconds rule', 'Amasekondi 3', '3 secondes', TRUE),
(5, 'C', '1 second rule', 'Ikisekonde 1', '1 seconde', FALSE),
(5, 'D', '5 seconds rule', 'Amasekondi 5', '5 secondes', FALSE);
