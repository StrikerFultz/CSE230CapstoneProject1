# Angel's branch

## MIPS32 Emulator - WASM Port

This project is a lab suite and web IDE (similar to ZyBooks), featuring a MIPS32 emulator written in Rust. The Rust code is compiled to WASM so the IDE may integrate the emulator component.

### Feature Completion:
**Emulator**:
- Core Emulator [x]
- ISA Specifications [x]
- Memory Manager [x]
- MMIO Spec [x]

**Frontend**:
- Lab Suite [ ]
- Web IDE [x]
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


**Run Web Server**
1. Build (WASM) from root directory
```sh
wasm-pack build --target web --release --out-dir web/pkg
```
2. Run web server from `web/` directory
```sh
python3 server.py
```

**Build emulator binary**
1. Compile and run the program
```sh
cargo run --release
```
2. Run test cases
```sh
cargo test
```


**Steps on Apple**
```sh
curl https://sh.rustup.rs -sSf | sh
```
```sh
source $HOME/.cargo/env
```
**installing rust ^^, only once needed**
```sh
rustup update
```
```sh
rustup default stable
```
```sh
rustup target add wasm32-unknown-unknown
```
```sh
cargo install wasm-pack
```


**Run web server**
```sh
wasm-pack build --target web --release --out-dir web/pkg
```
```sh
cd web
```
```sh
python3 server.py
```
**open http://localhost:5000 in browser**
**remember to kill the pid if still running**

**Option 2: Build emulator binary**
```sh
cargo run --release
```
```sh
cargo test
``` 
**this checks agsint the test cases so it can be run after they are updated for validity**


**Team Members**:
* Kailey: Scrum Master (Emulator Dev)
* Angel: Emulator Dev (WASM and MMIO)
* Matthew: Emulator Dev
* Ethan: Emulator / Frontend (ALU Visual)

**Additional Members**:
* Paul: Emulator Dev (Memory)
* Jenna: Frontend / UI Dev