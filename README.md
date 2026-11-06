# Berlian Hardware Report API

The Express.js REST API and MariaDB backend for the Berlian IT Hardware Reporting system. It handles parameter validation, duplicate report prevention, and native Excel (.xlsx) generation.

## Tech Stack
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MariaDB
* **Utilities:** `exceljs` for XLSX document generation

## Database Schema Requirements
Ensure your MariaDB instance is running with the `db_hardware_report` database containing these core tables:
* `hardware_assets`
* `install_locations`
* `report_parameter`
* `health_reports` (stores validated checklist results in a JSON column)

## Installation & Setup
1. Clone this repository.
2. Run `npm install` to install dependencies.
3. Configure your database connection in your database configuration file (or via `.env`):
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=db_hardware_report
```

## Running the Server
Start the Express server (runs on port 8000 by default):
```bash
npm run dev
```
*(For development, run `npm run dev` to enable automatic restarts on file changes).*