use std::collections::HashMap;

const WORD_SIZE: usize  = 4;             // 4 bytes for a word
const PAGE_SIZE: usize  = 512;           // 512 bytes for a page
const PAGE_POWER: u32   = 9;              // 2^9 = 512
const PAGE_MASK: u32    = (PAGE_SIZE as u32) - 1;

// Memory Configurations
const DEFAULT_MMIO_ADDRESS: u32 = 0xFFFF_0000;

const DEFAULT_STACK_BASE_ADDRESS: u32 = 0x7FFF_FFFF;
const DEFAULT_STACK_POINTER: u32 = 0x7FFF_FFFC;      // Stack 4 bytes below base
const DEFAULT_TEXT_BASE_ADDRESS: u32 = 0x0040_0000;
const DEFAULT_STATIC_DATA_BASE_ADDRESS: u32 = 0x1000_0000;
const DEFAULT_HEAP_BASE_ADDRESS: u32 = 0x1000_8000;
const DEFAULT_HEAP_POINTER: u32 = 0x1000_8000;

#[inline]
fn page_index(addr: u32) -> u32 { addr >> PAGE_POWER }

#[inline]
fn page_offset(addr: u32) -> usize { (addr & PAGE_MASK) as usize }

pub struct Memory {
    pub pages: HashMap<u32, Box<[i8; PAGE_SIZE]>>
}

impl Memory {
    /*
    Store a word (4 bytes) at the specified address
    inputs:
        address: u32 - the memory address to store the word
        value: i32 - the word value to store
    */
    pub fn set_word(&mut self, address: u32, value: i32) {
        let page = page_index(address);       // Find the page that the address belongs to
        let offset = page_offset(address);  // Find the offset within the page

        if !self.pages.contains_key(&page) {                   // If the page doesn't exist, create it        
            self.pages.insert(page, Box::new([0; PAGE_SIZE]));
        }

        let page_data = self.pages.get_mut(&page).unwrap();     // Get a mutable reference to the page data

        let bytes = value.to_le_bytes();        // Convert the i32 value to bytes (little-endian)
        for i in 0..WORD_SIZE {                 // Write each byte to the correct offset
            page_data[offset + i] = bytes[i] as i8;
        }
    }
    /*
    Retrieve a word (4 bytes) from the specified address
    inputs:
        address: u32 - the memory address to retrieve the word from
    outputs:
        i32 - the retrieved word value
    */
    pub fn load_word(&mut self, address: u32) -> i32 {
        let page = page_index(address);        // Find the page that the address belongs to
        let offset = page_offset(address);   // Find the offset within the page

        if let Some(page_data) = self.pages.get(&page) {    // Ensure the page exists
            let mut bytes = [0 as u8; WORD_SIZE];           // Prepare an array to hold the bytes
            for i in 0..WORD_SIZE {                         // Read each byte from the correct offset
                bytes[i] = page_data[offset + i] as u8;
            }
            i32::from_le_bytes(bytes)             // Convert the bytes (little-endian) back to a i32 value 
        } else {
            0
        }
    }

    pub fn new() -> Self {
        println!("Memory module initialized.");
        println!("Stack Base Address: {:x}", DEFAULT_STACK_BASE_ADDRESS as u32);
        println!("Stack Page Pointer: {:x}", DEFAULT_STACK_BASE_ADDRESS - PAGE_SIZE as u32);

        let mut pages = HashMap::new();

        // stack 
        pages.insert((DEFAULT_STACK_BASE_ADDRESS - PAGE_SIZE as u32) >> PAGE_POWER, Box::new([0; PAGE_SIZE]));

        // heap
        pages.insert(DEFAULT_HEAP_BASE_ADDRESS >> PAGE_POWER, Box::new([0; PAGE_SIZE]));

        // static data (.bss)
        pages.insert(DEFAULT_STATIC_DATA_BASE_ADDRESS >> PAGE_POWER, Box::new([0; PAGE_SIZE]));

        // .text  
        pages.insert(DEFAULT_TEXT_BASE_ADDRESS >> PAGE_POWER, Box::new([0; PAGE_SIZE]));

        // MMIO range
        // probably want to specify the actual address for each MMIO register instead of mapping an entire page 
        // so we want to have an address for each register and then map 32/64/128 bits for the register
        pages.insert(DEFAULT_MMIO_ADDRESS >> PAGE_POWER, Box::new([0; PAGE_SIZE]));

        Memory {
            pages
        } 
    }
}