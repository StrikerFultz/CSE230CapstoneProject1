# ── Stage 1: Build Rust binary + WASM ──────────────────────────────
FROM rustlang/rust:nightly-slim AS rust-builder

RUN apt-get update && apt-get install -y curl && \
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src/ ./src/

# Build the native grader binary
RUN cargo build --release

# Build the WASM bundle for the frontend
RUN wasm-pack build --target web --release --out-dir web/pkg

# ── Stage 2: Python app ────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Copy Python dependencies and install
COPY web/requirements.txt .
RUN pip install -r requirements.txt gunicorn

# Copy the web directory (Flask app + frontend)
COPY web/ .

# Copy the compiled WASM pkg from stage 1
COPY --from=rust-builder /app/web/pkg ./pkg

# Copy the native grader binary and make it executable
COPY --from=rust-builder /app/target/release/mips-emu-wasm ./mips-emu-wasm
RUN chmod +x ./mips-emu-wasm

EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--timeout", "120", "--workers", "3", "server:app"]