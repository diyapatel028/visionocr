# Welcome to your Lovable project

## Project info

**URL**:  https://visionocr.lovable.app/ 



---

# 🔍 VisionOCR

**VisionOCR** is a modern **AI-powered Optical Character Recognition (OCR) web application** that extracts text from images with high accuracy.
It provides a clean UI, secure backend APIs, and seamless frontend–backend integration for real-world OCR use cases such as document scanning, notes digitization, and image-to-text conversion.

---

## 🌊 Features

* 📸 **Image-based OCR**

  * Upload images and extract readable text
  * Supports printed and semi-structured text
* 🧠 **AI-Powered Text Extraction**

  * Uses OCR engine for accurate recognition
* 🔐 **User Authentication System**

  * Secure login & registration
  * Token-based authentication
* 📂 **History Management**

  * Store and view previously scanned documents
* 🌐 **Web-based Interface**

  * Clean, modern, responsive UI
* ⚡ **Fast API Responses**

  * Optimized backend for quick processing

---

## 🚀 Setup & Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/diyapatel028/Visionocr.git
cd Visionocr
```

### 2️⃣ Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### 3️⃣ Run the Backend Server

```bash
python run.py
```

### 4️⃣ Open in Browser

```
http://localhost:8000
```

---

## 📁 Project Structure

```
visionocr/
├── run.py                   # Application entry point
├── requirements.txt         # Backend dependencies
├── app/
│   ├── main.py              # FastAPI initialization
│   ├── core/                # App configuration & security
│   ├── auth/                # Authentication logic
│   ├── api/                 # API routes
│   │   └── v1/
│   │       ├── auth.py      # Auth endpoints
│   │       ├── ocr.py       # OCR processing routes
│   │       └── users.py    # User management
│   ├── database/            # Database models & schemas
│   └── services/            # OCR engine logic
├── templates/               # HTML templates
├── static/                  # CSS, JS, assets
└── visionocr.db             # SQLite database
```

---

## 🌐 Pages & Authentication Flow

### 🌍 Public Pages

* **Home** (`/`) – App overview
* **Login** (`/login`) – User authentication
* **Register** (`/register`) – Create new account

### 🔒 Protected Pages (Login Required)

* **Dashboard** (`/dashboard`) – Upload & process images
* **History** (`/history`) – View OCR results
* **Profile** (`/profile`) – Manage account details

### 🔐 Authentication Flow

1. User registers or logs in
2. Backend issues JWT token
3. Token stored on client
4. Protected routes require valid token

---

## 📚 API Documentation

Interactive API documentation is available at:

* **Swagger UI**

```
http://localhost:8000/docs
```

* **ReDoc**

```
http://localhost:8000/redoc
```

---

## 🔌 API Endpoints Overview

### 🔐 Authentication (`/api/v1/auth`)

* `POST /register` – Create new user
* `POST /login` – Authenticate user
* `GET /me` – Get logged-in user info

---

### 📸 OCR (`/api/v1/ocr`)

* `POST /upload` – Upload image for OCR
* `POST /extract` – Extract text from image
* `GET /history` – Get OCR history

---

### 👤 Users (`/api/v1/users`)

* `GET /profile` – User profile
* `PUT /profile` – Update profile
* `DELETE /account` – Delete user account

---

## 🔧 Key Technical Highlights

### 🧠 OCR Engine

* Image preprocessing for better accuracy
* Text extraction using OCR libraries
* Supports multiple image formats

### 🔐 Security

* JWT authentication
* Password hashing
* Protected API routes
* Input validation

### 🗄️ Database

* SQLite for lightweight storage
* Stores users & OCR results
* Automatic database initialization

### 🎨 Frontend

* Modern UI (HTML, CSS, JS)
* Responsive design
* Async API calls
* Error handling & validation

---

## 🎯 User Journey

1. User registers or logs in
2. Uploads an image
3. OCR engine extracts text
4. Result is displayed instantly
5. OCR data is saved to history
6. User can download or reuse extracted text

---


* The SQLite database is created automatically on first run
* This project is suitable for:

  * OCR-based products
  * PDF OCR support
  * Resume & portfolio projects
  * AI + Web application demos
    
* Future improvements:

  * Multi-language recognition
  * Export results as TXT / DOCX / PDF



Just tell me 🔥

