use std::collections::HashMap;

const WORD_SIZE: usize = 4; // 4 bytes for a word
const PAGE_SIZE: usize = 512; // 512 bytes for a page
const PAGE_POWER: u32 = 9; // 2^9 = 512

// Memory Configurations
const DEFAULT_STACK_BASE_ADDRESS: u32 = 0x7FFFFFFF;
const DEFAULT_STACK_POINTER: u32 = 0x7FFFFFFC;      // Stack 4 bytes below base
const DEFAULT_TEXT_BASE_ADDRESS: u32 = 0x00400000;
const DEFAULT_STATIC_DATA_BASE_ADDRESS: u32 = 0x10000000;
const DEFAULT_HEAP_BASE_ADDRESS: u32 = 0x10008000;
const DEFAULT_HEAP_POINTER: u32 = 0x10008000;

pub struct Memory {
    stack_base_address: u32,
    stack_pointer: u32,
    heap_base_address: u32,
    heap_pointer: u32,
    static_data_base_address: u32,
    text_base_address: u32,
    pub pages: HashMap<u32, Box<[i8; PAGE_SIZE]>>,
}

impl Memory {
    /*
    Store a word (4 bytes) at the specified address
    inputs:
        address: u32 - the memory address to store the word
        value: i32 - the word value to store
    */
    pub fn set_word(&mut self, address: u32, value: i32) {
        let page = address >> PAGE_POWER as u32;                    // Find the page that the address belongs to
        let offset = (address & (PAGE_SIZE as u32 - 1)) as usize;   // Find the offset within the page

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
        let page = address >> PAGE_POWER as u32;                    // Find the page that the address belongs to
        let offset = (address & (PAGE_SIZE as u32 - 1)) as usize;   // Find the offset within the page

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
        pages.insert((DEFAULT_STACK_BASE_ADDRESS - PAGE_SIZE as u32) >> PAGE_POWER as u32, Box::new([0; PAGE_SIZE]));
        pages.insert(DEFAULT_HEAP_BASE_ADDRESS >> PAGE_POWER as u32, Box::new([0; PAGE_SIZE]));
        pages.insert(DEFAULT_STATIC_DATA_BASE_ADDRESS >> PAGE_POWER as u32, Box::new([0; PAGE_SIZE]));
        pages.insert(DEFAULT_TEXT_BASE_ADDRESS >> PAGE_POWER as u32, Box::new([0; PAGE_SIZE]));
        pages.insert(DEFAULT_TEXT_BASE_ADDRESS >> PAGE_POWER as u32, Box::new([0; PAGE_SIZE]));

        Memory { 
            stack_base_address: DEFAULT_STACK_BASE_ADDRESS,
            stack_pointer: DEFAULT_STACK_POINTER,
            heap_base_address: DEFAULT_HEAP_BASE_ADDRESS,
            heap_pointer: DEFAULT_HEAP_POINTER,
            static_data_base_address: DEFAULT_STATIC_DATA_BASE_ADDRESS,
            text_base_address: DEFAULT_TEXT_BASE_ADDRESS,
            pages,
        } 
    }
}