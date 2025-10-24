# Paul's Branch
In the root crate, lib.rs, the class MIPSProgram serves as the entrance class. Where any interaction with mips is done through this class. Like the CPU, assembler, global variables, etc.

## MIPS32 Emulator - WASM Port

This project is a lab suite and web IDE (similar to ZyBooks), featuring a MIPS32 emulator written in Rust. The Rust code is compiled to WASM so the IDE may integrate the emulator component.

### Feature Completion:
**Emulator**:
- Core Emulator [ ]
- ISA Specifications [x]
- Memory Manager [ ]
- MMIO Spec [ ]

**Frontend**:
- Lab Suite [ ]
- Web IDE [ ]
- WASM Integration [x]
- Canvas Integration [ ]

### Installation
**Requirements**:
* Rust toolchain
* Installation of `wasm-pack` to build WASM bundle
* Static web server (Python or Node)

**Steps on Windows x64:**
1. Install Rust 
2. Update to stable
```sh
rustup update
rustup default stable
```
3. Add web assembly target platform
```sh
rustup target add wasm32-unknown-unknown
```
4. Install `wasm-pack`
```sh
cargo install wasm-pack
```


**Option 1: Run Web Server**
1. Build (WASM) from root directory
```sh
wasm-pack build --target web --release --out-dir web/pkg
```
2. Run web server from `web/` directory
```sh
python3 -m http.server
```

**Option 2: Build local binary**
1. Compile and run the program
```sh
cargo run
```
2. Run test cases
```sh
cargo test
```


**Steps on Apple**
curl https://sh.rustup.rs -sSf | sh
source $HOME/.cargo/env
    **installing rust ^^, only once needed**
rustup update
rustup default stable
rustup target add wasm32-unknown-unknown
cargo install wasm-pack


**Option 1 Run web server**
wasm-pack build --target web --release --out-dir web/pkg
cd web
python3 -m http.server
**open http://localhost:8000 in browser**

**Option 2: Build local binary**
cargo run
cargo test **this checks agsint the test cases so it can be run after they are updated for validity**


**Team Members**:
* Kailey: Scrum Master (Emulator Dev)
* Angel: Emulator Dev (WASM and MMIO)
* Matthew: Emulator Dev
* Ethan: Emulator / Frontend (ALU Visual)
* Paul: Emulator Dev (Memory)
* Jenna: Frontend / UI Dev