# MIPS32 Emulator - Vercel Serverless Port

**Note**: This project has been migrated from a native Docker/Railway environment to a **Serverless Architecture** on Vercel. The database is hosted on **Neon PostgreSQL**, and the autograder now runs via a Node.js/WASM bridge rather than a native binary.

## Project Overview
This project is a lab suite and web IDE (similar to ZyBooks), featuring a MIPS32 emulator written in Rust. The Rust code is compiled to WASM so the IDE may integrate the emulator component.

### Feature Completion:
**Emulator (Rust Core)**:
- Core Emulator [x]
- ISA Specifications [x]
- Memory Manager [x]
- MMIO Spec [x]

**Full Stack**:
- Web IDE [x]
- Serverless Autograder [x]
- Persistent Lab Progress (Neon/PostgreSQL) [x]
- Professor Dashboard [x]

---

## Architecture Details
The application is split into three main components to fit Vercel’s stateless constraints:
1. **Frontend**: Static HTML/JS/CSS served via `@vercel/static`.
2. **API Backend**: Python (Flask) serverless functions for user management, lab logic, and grade submission.
3. **Emulator Service**: A Node.js serverless function that imports the WASM core (compiled for `nodejs`) to grade student code in-process.



---

## Local Development Setup

### 1. Requirements
* **Rust Toolchain**: `rustup` and `cargo`
* **wasm-pack**: `cargo install wasm-pack`
* **Python 3.9+**: For local API testing
* **Node.js 18+**: For running the emulator service locally

### 2. Environment Variables
Create a `.env` file in the root directory with the following vars:
```bash
DATABASE_URL=X
FLASK_SECRET_KEY=X
EMULATOR_URL=http://localhost:3000/api/emulator
```

### 3. Build Instructions (CRITICAL)
You must build two different WASM targets for the browser and serverless backend:

**Build for Frontend (Web):**
```bash
wasm-pack build --target web --release --out-dir ./vercel-port/public/pkg
```

**Build for Backend Autograder (Node.js):**
```bash
wasm-pack build --target nodejs --release --out-dir ./vercel-port/api/pkg-node
```

---

## Contributions
**Team Members**:
* Kailey: Scrum Master
* Angel: Emulator Dev
* Matthew: Backend 
* Ethan: Emulator / Frontend

**Additional Members**:
* Paul: Emulator Dev
* Jenna: Frontend / UI Dev