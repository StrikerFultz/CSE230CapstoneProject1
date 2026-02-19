export const LESSONS = {
  "lab-1-0": {
    title: "1.0 Tutorial: Using the MIPS Emulator",
    starter_code: `# Tutorial Starter Code
# Initialize Registers
li $t0, 10      # Load immediate 10 into $t0
li $t1, 20      # Load immediate 20 into $t1

# Arithmetic Operation
add $t2, $t0, $t1  # $t2 = 10 + 20 = 30

# Memory Operation
li $s0, 0x10000000 # Load base address
sw $t2, 0($s0)     # Store 30 into memory at 0x10000000

# End
# (The emulator stops automatically when instructions run out)
`,
    html: `
<div style="max-width: 800px; margin: 0 auto;">
  <h3>Welcome to the MIPS Emulator</h3>
  <p>
    This environment is designed to help you write, debug, and test MIPS assembly code. 
    Before starting the assignments, please familiarize yourself with the interface controls below.
  </p>

  <h4>1. The Interface Controls</h4>
  <ul>
    <li><strong>Run:</strong> Assembles the code and executes it until completion or error.</li>
    <li><strong>Step:</strong> Executes the code one line at a time. This is useful for debugging to see how registers change.</li>
    <li><strong>Stop:</strong> Resets the emulator, clears registers, and wipes memory.</li>
    <li><strong>Registers Panel:</strong> Shows the current state of the CPU. <br><em>Tip: You can click inside the value box of a register to manually edit it between steps!</em></li>
    <li><strong>Memory Panel:</strong> Shows the hex and ASCII representation of memory. Use the "Address" input and "Go" button to jump to specific regions (default is <code>0x10000000</code>).</li>
  </ul>

  <h4>2. Using Breakpoints</h4>
  <p>
    You can pause execution at a specific line without stepping through the whole program manually:
  </p>
  <ol>
    <li>Click the <strong>gutter</strong> (the space to the left of the line numbers) in the code editor.</li>
    <li>A <span style="color:red; font-weight:bold">red dot</span> will appear.</li>
    <li>Press <strong>Run</strong>. The program will execute at full speed and pause automatically when it hits that line.</li>
  </ol>

  <h4>3. Supported Instruction Set</h4>
  <p>
    This emulator supports the following subset of the MIPS instruction set. 
    Ensure you only use these instructions in your labs.
  </p>

  <div class="center-table">
    <table>
      <thead>
        <tr><th>Category</th><th>Instructions</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Arithmetic</strong></td>
          <td>
            <code>add</code>, <code>addu</code>, <code>sub</code>, <code>subu</code>, 
            <code>addi</code>, <code>addiu</code>, <code>mult</code>, <code>multu</code>, 
            <code>div</code>, <code>divu</code>
          </td>
        </tr>
        <tr>
          <td><strong>Logical</strong></td>
          <td>
            <code>and</code>, <code>andi</code>, <code>or</code>, <code>ori</code>, 
            <code>xor</code>, <code>xori</code>, <code>nor</code>
          </td>
        </tr>
        <tr>
          <td><strong>Data Transfer</strong></td>
          <td>
            <code>lw</code> (load word), <code>sw</code> (store word), <br>
            <code>lb</code> (load byte), <code>sb</code> (store byte), <br>
            <code>lh</code> (load half), <code>sh</code> (store half), <br>
            <code>lui</code> (load upper imm), <code>mfhi</code>, <code>mflo</code>
          </td>
        </tr>
        <tr>
          <td><strong>Branch & Jump</strong></td>
          <td>
            <code>beq</code>, <code>bne</code>, <code>j</code>, <code>jal</code>, <code>jr</code>
          </td>
        </tr>
        <tr>
          <td><strong>Comparison (Set)</strong></td>
          <td>
            <code>slt</code>, <code>slti</code>, <code>sltiu</code>, <code>sltu</code>
          </td>
        </tr>
        <tr>
          <td><strong>Shifting</strong></td>
          <td>
            <code>sll</code> (shift left logical), <br>
            <code>srl</code> (shift right logical), <br>
            <code>sra</code> (shift right arithmetic)
          </td>
        </tr>
        <tr>
          <td><strong>Pseudo-Instructions</strong></td>
          <td>
            <code>li</code> (load immediate), <br>
            <code>la</code> (load address), <br>
            <code>move</code> (copy register), <br>
            <code>blt</code>, <code>bgt</code>, <code>ble</code>, <code>bge</code> (branch comparisons)
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <h4>4. Tutorial Exercise</h4>
  <p>
    To complete this tutorial lab, follow these steps:
  </p>
  <ol>
    <li>Review the code in the <strong>Assembler</strong> panel.</li>
    <li>Click the <strong>Step</strong> button repeatedly to watch <code>$t0</code>, <code>$t1</code>, and <code>$t2</code> change.</li>
    <li>Observe the <strong>Memory</strong> panel. After the <code>sw</code> instruction executes, the value <code>30</code> (hex <code>1E</code>) will appear at address <code>0x10000000</code>.</li>
    <li>Check the <strong>Test Cases</strong> below to see if your execution matches the requirements.</li>
  </ol>
</div>
`,
    testCases: [
      {
        name: "Tutorial Check: Register Values",
        points: 5,
        initialRegisters: {}, 
        expectedRegisters: {
          "$t0": 10,
          "$t1": 20,
          "$t2": 30,
          "$s0": 268435456 // Decimal for 0x10000000
        }
      },
      {
        name: "Tutorial Check: Memory Storage",
        points: 5,
        initialRegisters: {},
        expectedMemory: {
          268435456: 30 
        }
      }
    ]
  },
  "lab-12-2": {
    title: "12.2 LAB: Arithmetic expression - add/sub",
    html: `
<p style="text-align:center">
  Given the mapping of registers to variables below, write a program to implement the following expression:
</p>
<p style="text-align:center;font-weight:bold">
  Z = A + B + C - D
</p>

<p style="text-align:center; font-weight:600;">
  Use only <code>$t0</code> as a temporary register during implementation.
</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Variables</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>A</td></tr>
      <tr><td>$s1</td><td>B</td></tr>
      <tr><td>$s2</td><td>C</td></tr>
      <tr><td>$s3</td><td>D</td></tr>
      <tr><td>$s4</td><td>Z</td></tr>
    </tbody>
  </table>
</div>

<p class="lesson-example">
  Assume the registers are initialized as follows. When your program finishes, the value in <code>$s4</code> should hold <code>Z</code>.
</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Register</th><th>Initial value</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0 (A)</td><td>2</td></tr>
      <tr><td>$s1 (B)</td><td>4</td></tr>
      <tr><td>$s2 (C)</td><td>6</td></tr>
      <tr><td>$s3 (D)</td><td>3</td></tr>
      <tr><td>$s4 (Z)</td><td>?</td></tr>
    </tbody>
  </table>
</div>

<p class="lesson-example">
  Hint: Think of this as <code>Z = ((A + B) + C) - D</code> and build it up in <code>$t0</code> one step at a time.
</p>
`,
    testCases: [
      {
        name: "Test 1: Compare storage (4 points)",
        points: 4,
        initialRegisters: {
          "$s0": 2,
          "$s1": 4,
          "$s2": 6,
          "$s3": 5
        },
        expectedRegisters: {
          "$t0": 12,
          "$s0": 2,
          "$s1": 4,
          "$s2": 6,
          "$s3": 5,
          "$s4": 7
        }
      },
      {
        name: "Test 2: Compare storage (3 points)",
        points: 3,
        initialRegisters: {
          "$s0": 1,
          "$s1": 2,
          "$s2": 3,
          "$s3": 10
        },
        expectedRegisters: {
          "$t0": 6,
          "$s0": 1,
          "$s1": 2,
          "$s2": 3,
          "$s3": 10,
          "$s4": -4
        }
      },
      {
        name: "Test 3: Compare storage (3 points)",
        points: 3,
        initialRegisters: {
          "$s0": 1,
          "$s1": 1,
          "$s2": 1,
          "$s3": 3
        },
        expectedRegisters: {
          "$t0": 3,
          "$s0": 1,
          "$s1": 1,
          "$s2": 1,
          "$s3": 3,
          "$s4": 0
        }
      }
    ]
  },

  "lab-12-3": {
    title: "12.3 LAB: Arithmetic expression - add/sub/mult",
    html: `
<p style="text-align:center">
  Given the mapping of registers to variables below, write a program to implement the following expression:
</p>
<p style="text-align:center;font-weight:bold">
  Z = (A + B) * (C - D)
</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Variables</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>A</td></tr>
      <tr><td>$s1</td><td>B</td></tr>
      <tr><td>$s2</td><td>C</td></tr>
      <tr><td>$s3</td><td>D</td></tr>
      <tr><td>$s4</td><td>Z</td></tr>
    </tbody>
  </table>
</div>

<p class="lesson-example">
  Ex: If the values of <code>$s0</code>, <code>$s1</code>, <code>$s2</code>, and <code>$s3</code> are initialized in the simulator as:
</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Register</th><th>Data</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>2</td></tr>
      <tr><td>$s1</td><td>4</td></tr>
      <tr><td>$s2</td><td>6</td></tr>
      <tr><td>$s3</td><td>3</td></tr>
    </tbody>
  </table>
</div>

<p class="lesson-example">
  the result is stored in <code>$s4</code>:
</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Register</th><th>Data</th></tr>
    </thead>
    <tbody>
      <tr><td>$s4</td><td>18</td></tr>
    </tbody>
  </table>
</div>

<p class="lesson-example">
  <strong>Note:</strong> Use the '+' button under the Registers display to initialize register values for <code>$s0</code>, <code>$s1</code>, <code>$s2</code>, and <code>$s3</code>.
</p>
`,
    testCases: [
      {
        name: "Test 1: Compare storage (4 points)",
        points: 4,
        initialRegisters: {
          "$s0": 2,
          "$s1": 4,
          "$s2": 6,
          "$s3": 3
        },
        expectedRegisters: {
          "$s0": 2,
          "$s1": 4,
          "$s2": 6,
          "$s3": 3,
          "$s4": 18
        }
      },
      {
        name: "Test 2: Compare storage (3 points)",
        points: 3,
        initialRegisters: {
          "$s0": 3,
          "$s1": 6,
          "$s2": 3,
          "$s3": 6
        },
        expectedRegisters: {
          "$s0": 3,
          "$s1": 6,
          "$s2": 3,
          "$s3": 6,
          "$s4": -27
        }
      },
      {
        name: "Test 3: Compare storage (3 points)",
        points: 3,
        initialRegisters: {
          "$s0": 5,
          "$s1": 5,
          "$s2": 5,
          "$s3": 5
        },
        expectedRegisters: {
          "$s0": 5,
          "$s1": 5,
          "$s2": 5,
          "$s3": 5,
          "$s4": 0
        }
      }
    ]
  },

"lab-12-11": {
    title: "12.11 LAB: Arithmetic Expressions",
    starter_code: `add $t1, $s1, $s3

addi $t0, $zero, 13
lw $t0, 0($t0)

sub $t1, $s4, $s2
sub $t2, $s5, $s1
add $t1, $t1, $t2

add $s0, $t0, $t1
`,
    html: `
<p style="text-align:center">
  Given the mapping of registers to variables below, write a program to implement the following expression:
</p>

<p style="text-align:center;font-weight:bold">
  y = ((x1 + x3) - (x5 - x7)) + ((x4 - x2 + x6) + (x5 - x1))
</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Variables</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>y</td></tr>
      <tr><td>$s1</td><td>x1</td></tr>
      <tr><td>$s2</td><td>x2</td></tr>
      <tr><td>$s3</td><td>x3</td></tr>
      <tr><td>$s4</td><td>x4</td></tr>
      <tr><td>$s5</td><td>x5</td></tr>
      <tr><td>$s6</td><td>x6</td></tr>
      <tr><td>$s7</td><td>x7</td></tr>
    </tbody>
  </table>
</div>

<p style="text-align:center">
  You may use any temporary registers from <code>$t0</code> to <code>$t9</code>.
  Clearly specify your choice of registers using comments.
</p>

<p style="text-align:center">
  Important: Do not simplify the expression.
</p>

<p class="lesson-example">
  Example test: If the values of <code>$s1</code> through <code>$s7</code> are initialized in the simulator as:
</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Register</th><th>Data</th></tr>
    </thead>
    <tbody>
      <tr><td>$s1</td><td>4</td></tr>
      <tr><td>$s2</td><td>6</td></tr>
      <tr><td>$s3</td><td>5</td></tr>
      <tr><td>$s4</td><td>2</td></tr>
      <tr><td>$s5</td><td>-3</td></tr>
      <tr><td>$s6</td><td>-1</td></tr>
      <tr><td>$s7</td><td>0</td></tr>
    </tbody>
  </table>
</div>

<p class="lesson-example">
  the result is stored in $s0:
</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Register</th><th>Data</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>0</td></tr>
      <tr><td>$s1</td><td>4</td></tr>
      <tr><td>$s2</td><td>6</td></tr>
      <tr><td>$s3</td><td>5</td></tr>
      <tr><td>$s4</td><td>2</td></tr>
      <tr><td>$s5</td><td>-3</td></tr>
      <tr><td>$s6</td><td>-1</td></tr>
      <tr><td>$s7</td><td>0</td></tr>
    </tbody>
  </table>
</div>
`,
    testCases: [
      {
        name: "Test 1: Compare storage (5 points)",
        points: 5,
        initialRegisters: {
          "$s1": 4,
          "$s2": 6,
          "$s3": 5,
          "$s4": 2,
          "$s5": -3,
          "$s6": -1,
          "$s7": 0
        },
        expectedRegisters: {
          "$s0": 0,
          "$s1": 4,
          "$s2": 6,
          "$s3": 5,
          "$s4": 2,
          "$s5": -3,
          "$s6": -1,
          "$s7": 0
        }
      },
      {
        name: "Test 2: Compare storage (5 points)",
        points: 5,
        initialRegisters: {
          "$s1": 3,
          "$s2": 4,
          "$s3": 0,
          "$s4": 6,
          "$s5": -4,
          "$s6": -1,
          "$s7": 8
        },
        expectedRegisters: {
          "$s0": 9,
          "$s1": 3,
          "$s2": 4,
          "$s3": 0,
          "$s4": 6,
          "$s5": -4,
          "$s6": -1,
          "$s7": 8
        }
      },
      {
        name: "Test 3: Compare storage (5 points)",
        points: 5,
        initialRegisters: {
          "$s1": 0,
          "$s2": -10,
          "$s3": 10,
          "$s4": -15,
          "$s5": 15,
          "$s6": 5,
          "$s7": 20
        },
        expectedRegisters: {
          "$s0": 30,
          "$s1": 0,
          "$s2": -10,
          "$s3": 10,
          "$s4": -15,
          "$s5": 15,
          "$s6": 5,
          "$s7": 20
        }
      }
    ]
  },

"lab-12-12": {
  title: "12.12 Zylab 1 - ALU and Data Transfer Instructions",
  html: `
<p>
  Given an array of 2 integers, write a MIPS program to implement some ALU operations and store
  the results back to memory. The C code below shows how the elements are appended to the array:
</p>

<pre>
// Declaration of variables
int* A;       // Integer array A with the base address pointing to variable A
int a;
char b, c;
short d;

// Append array elements
{ A[2], A[4] } = A[1] * A[0];              // {} = concatenation/append. 64-bit product stored in Array
A[5] = A[4] / 230;
a = A[4] % 230;
b = a >> 16;                                // '>>' = right shift
c = (a & 0b'1000) | (b | 0b'0011);         // '&' = bit-wise and
d = a << 2;                                 // '<<' = left shift
A[6] = {b, c, d};                          // {} = concatenation/append. Use Memory Operations
A[3] = (A[0] + A[1] - 100) - (A[2] + A[4] - A[5]);
</pre>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Variables</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>A</td></tr>
    </tbody>
  </table>
</div>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Addresses</th><th>Contents</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>A[0]</td></tr>
      <tr><td>$s0+4</td><td>A[1]</td></tr>
    </tbody>
  </table>
</div>

<p>
  You may use any temporary registers from <code>$t0</code> to <code>$t9</code> or saved
  registers from <code>$s1</code> to <code>$s7</code>. Clearly specify your choice of
  registers and explain your code using comments.
</p>

<p class="lesson-example">
  Example Test: If the value of <code>$s0</code> and Memory are initialized in the simulator as below:
</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Data</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>8016</td></tr>
    </tbody>
  </table>
</div>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Addresses</th><th>Contents</th></tr>
    </thead>
    <tbody>
      <tr><td>8016</td><td>-5</td></tr>
      <tr><td>8020</td><td>8</td></tr>
    </tbody>
  </table>
</div>

<p>The resultant array is:</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Addresses</th><th>Contents</th></tr>
    </thead>
    <tbody>
      <tr><td>8016</td><td>-5</td></tr>
      <tr><td>8020</td><td>8</td></tr>
      <tr><td>8024</td><td>7</td></tr>
      <tr><td>8028</td><td>-64</td></tr>
      <tr><td>8032</td><td>-4</td></tr>
      <tr><td>8036</td><td>0</td></tr>
      <tr><td>8040</td><td>-160</td></tr>
    </tbody>
  </table>
</div>
`,
  testCases: [
    {
      name: "Test 1: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 4000
      },
      initialMemory: {
        4000: 4,
        4004: 5
      },
      expectedRegisters: {
        "$s0": 4000
      },
      expectedMemory: {
        4000: 4,
        4004: 5,
        4008: 0,
        4012: -111,
        4016: 20,
        4020: 0,
        4024: 196688
      }
    },
    {
      name: "Test 2: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 13804
      },
      initialMemory: {
        13804: -8,
        13808: -4
      },
      expectedRegisters: {
        "$s0": 13804
      },
      expectedMemory: {
        13804: -8,
        13808: -4,
        13812: -12,
        13816: -13,
        13820: 32,
        13824: 0,
        13828: 196736
      }
    },
    {
      name: "Test 3: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 8016
      },
      initialMemory: {
        8016: -5,
        8020: 8
      },
      expectedRegisters: {
        "$s0": 8016
      },
      expectedMemory: {
        8016: -5,
        8020: 8,
        8024: 7,
        8028: -64,
        8032: -4,
        8036: 0,
        8040: -160
      }
    },
    {
      name: "Test 4: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 2304
      },
      initialMemory: {
        2304: 5,
        2308: -8
      },
      expectedRegisters: {
        "$s0": 2304
      },
      expectedMemory: {
        2304: 5,
        2308: -8,
        2312: 4,
        2316: -67,
        2320: -4,
        2324: 0,
        2328: -160
      }
    }
  ]
},

"lab-12-13": {
  title: "12.13 Zylab 2 - Loops (Conditional and Unconditional Branch Instructions)",
  html: `
<p>
  To save some space in Memory, I would like to remove duplicate data, for example duplicate
  student ID numbers. Towards this, let us consider an array which may contain duplicates. Here
  we will consider the data to be small integers. The same code can be used for large integer
  values.
</p>

<p>Given an array (base address and number of elements), write a MIPS program to do the following:</p>
<ul>
  <li>delete all duplicate elements.</li>
  <li>final array should contain unique integers only.</li>
  <li>the size of the array should be updated after deleting duplicates.</li>
</ul>

<p>
  Below is an example of the C code segment to perform the above task. You may use a different
  code, but you have to write the code that you use as a comment before the MIPS code.
</p>

<pre>
// Declaration of variables
int* Array;       // Base address of array A
int size;         // Length of the array A
int i, j, k;      // Given value to be removed from array

// Remove elements equal to val
i = 0;
while (i < size) {
    j = i + 1;
    while(j < size)  {
        if(Array[i] == Array[j]){
            for (k = j; k < size-1; k++)  {       // Shift elements if element is less than value
                Array[k] = Array[k+1];
            }
            size = size - 1;                      // if element deleted, length of array decreases
        }
        else
            j ++;
    }
    i ++;
}
</pre>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Variables</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>Array</td></tr>
      <tr><td>$s1</td><td>size</td></tr>
    </tbody>
  </table>
</div>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Addresses</th><th>Contents</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>Array[0]</td></tr>
      <tr><td>$s0+4</td><td>Array[1]</td></tr>
      <tr><td>$s0+8</td><td>Array[2]</td></tr>
      <tr><td>…</td><td>…</td></tr>
      <tr><td>$s0+4*(size-1)</td><td>Array[n-1]</td></tr>
    </tbody>
  </table>
</div>

<p>
  You may use any temporary registers from <code>$t0</code> to <code>$t9</code> or saved
  registers from <code>$s2</code> to <code>$s7</code>. Clearly specify your choice of
  registers and explain your code using comments.
</p>

<p class="lesson-example">
  Example Test: If the values of <code>$s0</code> through <code>$s1</code> and array elements
  are initialized in the simulator as:
</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Data</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>4000</td></tr>
      <tr><td>$s1</td><td>10</td></tr>
    </tbody>
  </table>
</div>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Addresses</th><th>Contents</th></tr>
    </thead>
    <tbody>
      <tr><td>4000</td><td>4</td></tr>
      <tr><td>4004</td><td>8</td></tr>
      <tr><td>4008</td><td>-13</td></tr>
      <tr><td>4012</td><td>8</td></tr>
      <tr><td>4016</td><td>-13</td></tr>
      <tr><td>4020</td><td>-13</td></tr>
      <tr><td>4024</td><td>0</td></tr>
      <tr><td>4028</td><td>8</td></tr>
      <tr><td>4032</td><td>4</td></tr>
      <tr><td>4036</td><td>0</td></tr>
    </tbody>
  </table>
</div>

<p>The resultant registers are:</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Data</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>4000</td></tr>
      <tr><td>$s1</td><td>4</td></tr>
    </tbody>
  </table>
</div>

<p>The resultant array is:</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Addresses</th><th>Contents</th></tr>
    </thead>
    <tbody>
      <tr><td>4000</td><td>4</td></tr>
      <tr><td>4004</td><td>8</td></tr>
      <tr><td>4008</td><td>-13</td></tr>
      <tr><td>4012</td><td>0</td></tr>
    </tbody>
  </table>
</div>
`,
  testCases: [
    {
      name: "Test 1: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 4000,
        "$s1": 10
      },
      initialMemory: {
        4000: 4,
        4004: 8,
        4008: -13,
        4012: 8,
        4016: -13,
        4020: -13,
        4024: 0,
        4028: 8,
        4032: 4,
        4036: 0
      },
      expectedRegisters: {
        "$s0": 4000,
        "$s1": 4
      },
      expectedMemory: {
        4000: 4,
        4004: 8,
        4008: -13,
        4012: 0
      }
    },
    {
      name: "Test 2: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 13804,
        "$s1": 4
      },
      initialMemory: {
        13804: -8,
        13808: -4,
        13812: 4,
        13816: 8
      },
      expectedRegisters: {
        "$s0": 13804,
        "$s1": 4
      },
      expectedMemory: {
        13804: -8,
        13808: -4,
        13812: 4,
        13816: 8
      }
    },
    {
      name: "Test 3: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 8016,
        "$s1": 9
      },
      initialMemory: {
        8016: -50,
        8020: 80,
        8024: 100,
        8028: 0,
        8032: -80,
        8036: -50,
        8040: -100,
        8048: 0
      },
      expectedRegisters: {
        "$s0": 8016,
        "$s1": 6
      },
      expectedMemory: {
        8016: -50,
        8020: 80,
        8024: 100,
        8028: 0,
        8032: -80,
        8036: -100
      }
    },
    {
      name: "Test 4: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 10000,
        "$s1": 5
      },
      initialMemory: {
        10000: 230,
        10004: 230,
        10008: 230,
        10012: 230,
        10016: 230
      },
      expectedRegisters: {
        "$s0": 10000,
        "$s1": 1
      },
      expectedMemory: {
        10000: 230
      }
    }
  ]
},

"lab-12-14": {
  title: "12.14 Zylab 3 - Single Procedure Call",
  html: `
<p>
  Given an array of at least one integer, write a program to create a new array with elements
  equal to the power of each element in the original array raised to the index, i.e.,
  <code>P[i] = A[i]^i</code>.
</p>

<p>
  For this, write two functions that will be called in main function independently.
</p>

<ul>
  <li>
    <strong>power</strong>
    <ul>
      <li>inputs: element (A[i]) and index (i)</li>
      <li>task: returns the value of element raised to index (A[i]^i).</li>
    </ul>
  </li>
  <li>
    <strong>newElement</strong>
    <ul>
      <li>inputs: base address of new array P (*P), current size of P (variable k) and the new element (A[i]^i)</li>
      <li>task: add the new element at the end.</li>
      <li>This function does not return any value (void).</li>
    </ul>
  </li>
</ul>

<p>
  Following is a sample C code to perform the required task. You may modify the code for the
  functions, but the task performed should not be changed.
</p>

<pre>
int main() {
    // Variable Declaration
    int *A, *P;     // Base addresses of A and P
    int n, k;       // Lengths of arrays A and B
    int pow;        // Return value from power function

    // Task of main function
    P[0] = 1;       // 0th element = A[0]^0 = 1

    for (int j = 1; j < n; j++) {
        k = j;      // Current length of array B
        pow = power(A[j], j);
        newElement(P, k, pow);
    }
    k++;
}

int power(int a, int b) {
    int pow = a;
    for (int l = 1; l < b; l++) {
        pow = pow * a;
    }
    return(pow);
}

void newElement(int* P, int k, int pow) {
    P[k] = pow;
}
</pre>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Variables</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>A</td></tr>
      <tr><td>$s1</td><td>n</td></tr>
      <tr><td>$s2</td><td>P</td></tr>
      <tr><td>$s3</td><td>k</td></tr>
    </tbody>
  </table>
</div>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Addresses</th><th>Contents</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>A[0]</td></tr>
      <tr><td>$s0+4</td><td>A[1]</td></tr>
      <tr><td>…</td><td>…</td></tr>
      <tr><td>$s0+4*(n-1)</td><td>A[n-1]</td></tr>
    </tbody>
  </table>
</div>

<p class="lesson-example">
  Example Test: If the values of <code>$s1</code> through <code>$s7</code> are initialized
  in the simulator as:
</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Data</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>4000</td></tr>
      <tr><td>$s1</td><td>5</td></tr>
      <tr><td>$s2</td><td>8000</td></tr>
      <tr><td>$s3</td><td>0</td></tr>
    </tbody>
  </table>
</div>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Addresses</th><th>Contents</th></tr>
    </thead>
    <tbody>
      <tr><td>4000</td><td>10</td></tr>
      <tr><td>4004</td><td>5</td></tr>
      <tr><td>4008</td><td>-5</td></tr>
      <tr><td>4012</td><td>-2</td></tr>
      <tr><td>4016</td><td>0</td></tr>
    </tbody>
  </table>
</div>

<p>The resultant registers will be:</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Data</th></tr>
    </thead>
    <tbody>
      <tr><td>$s2</td><td>8000</td></tr>
      <tr><td>$s3</td><td>5</td></tr>
    </tbody>
  </table>
</div>

<p>The resultant array P is:</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Addresses</th><th>Contents</th></tr>
    </thead>
    <tbody>
      <tr><td>8000</td><td>1</td></tr>
      <tr><td>8004</td><td>5</td></tr>
      <tr><td>8008</td><td>25</td></tr>
      <tr><td>8012</td><td>-8</td></tr>
      <tr><td>8016</td><td>0</td></tr>
    </tbody>
  </table>
</div>
`,
  testCases: [
    {
      name: "Test 1: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 4000,
        "$s1": 5,
        "$s2": 8000,
        "$s3": 0
      },
      initialMemory: {
        4000: 10,
        4004: 5,
        4008: -5,
        4012: -2,
        4016: 0
      },
      expectedRegisters: {
        "$s2": 8000,
        "$s3": 5
      },
      expectedMemory: {
        8000: 1,
        8004: 5,
        8008: 25,
        8012: -8,
        8016: 0
      }
    },
    {
      name: "Test 2: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 13800,
        "$s1": 1,
        "$s2": 13804,
        "$s3": 0
      },
      initialMemory: {
        13800: -8
      },
      expectedRegisters: {
        "$s2": 13804,
        "$s3": 1
      },
      expectedMemory: {
        13804: 1
      }
    },
    {
      name: "Test 3: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 8016,
        "$s1": 10,
        "$s2": 8000,
        "$s3": 0
      },
      initialMemory: {
        8016: -5,
        8020: 8,
        8024: 4,
        8028: -6,
        8032: 6,
        8036: 0,
        8040: -3,
        8044: -2,
        8048: 2,
        8052: -2
      },
      expectedRegisters: {
        "$s2": 8000,
        "$s3": 10
      },
      expectedMemory: {
        8000: 1,
        8004: 8,
        8008: 16,
        8012: -216,
        8016: 1296,
        8020: 0,
        8024: 729,
        8028: -128,
        8032: 256,
        8036: -512
      }
    },
    {
      name: "Test 4: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 2648,
        "$s1": 8,
        "$s2": 2648,
        "$s3": 0
      },
      initialMemory: {
        2648: -80,
        2652: -40,
        2656: 25,
        2660: 20,
        2664: -15,
        2668: 10,
        2672: -8,
        2676: -4
      },
      expectedRegisters: {
        "$s2": 2648,
        "$s3": 8
      },
      expectedMemory: {
        2648: 1,
        2652: -40,
        2656: 625,
        2660: 8000,
        2664: 50625,
        2668: 100000,
        2672: 262144,
        2676: -16384
      }
    }
  ]
},

"lab-12-15": {
  title: "12.15 Zylab 4 - Nested Procedure Call",
  html: `
<p>
  Write a MIPS program to add a given node in a linked list at the specified location, using
  <strong>Nested Procedure Calls</strong>. If your code runs perfectly, but you didn't use
  Procedure Execution correctly, you will be given zero points.
</p>

<p>Given Inputs:</p>
<ul>
  <li>the head of a linked list, i.e, address of the start (first node) of the list</li>
  <li>location: number of node in the linked list after which node is to be added
      (0 to add before the 1st node, 1 to add after 1st node and so on.)</li>
  <li>the address of the node to be inserted</li>
</ul>

<p>And each node contains:</p>
<ul>
  <li>an integer value</li>
  <li>address to the next node (address is NULL (0) if it is the last node in the list)</li>
</ul>

<p>Write the following three functions that will be called in order to update the linked list by adding the new node.</p>

<ul>
  <li>
    <strong>main</strong>
    <ul>
      <li>task: calls the addNode function and reads the value of the newly added node.</li>
    </ul>
  </li>
  <li>
    <strong>addNode</strong>
    <ul>
      <li>inputs: head of linked list (head), location to add node (n) and address of node to be added (node)</li>
      <li>task: calls the findNode function and add the node after the n^th node in the linked list.
          If the number is greater than the size of list, then add the node at the end of the list.</li>
      <li>output: value of the inserted node.</li>
    </ul>
  </li>
  <li>
    <strong>findNode</strong>
    <ul>
      <li>inputs: head of linked list (*head) and location to add node (n)</li>
      <li>task: navigate the linked list to find the addresses of the n^th and (n+1)^th nodes</li>
      <li>outputs: addresses of the n^th and (n+1)^th nodes.</li>
    </ul>
  </li>
</ul>

<p>
  Following is a sample C code segment to perform the required task. (this code is incomplete
  and does not include creating the linked list or a new node, so you cannot compile it using
  any C compiler.) You may modify the code for the functions, but the task performed should
  not be changed.
</p>

<pre>
// Parameters of a node in the linked list (need not declare or initialize in MIPS)
typedef struct node {
    int value;      // Value in the node accessed by node->value
    node* next;     // Address of next node accessed by node->next
} node;             // Datatype for each node

node *head;         // address of head (first node) of linked list (global pointer)

int main() {
    // Variable Declaration
    node *newNode;  // address of node to be added
    int n;          // number of the node in the list after which node is to be added
    int value;      // Value of the node to be added

    // Task of main function
    value = addNode(head, n, newNode);
}

int addNode (node* head, int n, node* newNode) {
    node *addr1, *addr2; // addr1 = address of n^th node, addr2 = address of (n+1)^th node
    if (n == 0 || head == 0) {                  // If node should be added at the beginning of the list
        newNode->next = head;   // Next for new node = head of original list
        head = newNode;         // global head updated to the new node
        return(newNode->value); // value of the node = data at the address of the node, and then return to caller
    }
    [addr1, addr2] = findNode (head, n);        // Call findNode function
    addr1->next = newNode;      // Next for n^th node = node to be added
    newNode->next = addr2;      // Next for added node = (n+1)^th node of original list
    return(newNode->value);     // value of the node = data at the address of the node
}

node* findNode (node* head, int n) {
    node* curr = head;          // Start with head of linked list
    for (int i = 1; i < n; i ++) {
        curr = curr->next;      // Update the pointer to next node address
        if (curr == 0)          // Break if end of List
            break;
        if (curr->next == 0)    // Break if end of List
            break;
    }
    return([curr, curr->next]); // Two return values (need not return as array in MIPS)
}
</pre>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Variables</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>head</td></tr>
      <tr><td>$s1</td><td>newNode</td></tr>
      <tr><td>$s2</td><td>n</td></tr>
      <tr><td>$s3</td><td>val</td></tr>
    </tbody>
  </table>
</div>

<p>Linked List and New Node in Memory:</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Addresses</th><th>Contents</th></tr>
    </thead>
    <tbody>
      <tr><td>newNode</td><td>newNode->value</td></tr>
      <tr><td>head</td><td>node1->value</td></tr>
      <tr><td>head + 4</td><td>node1->next</td></tr>
      <tr><td>node1->next</td><td>node2->value</td></tr>
      <tr><td>node1->next + 4</td><td>node2->next</td></tr>
      <tr><td>node2->next</td><td>node3->value</td></tr>
      <tr><td>node2->next + 4</td><td>node3->next</td></tr>
      <tr><td>…</td><td>…</td></tr>
    </tbody>
  </table>
</div>

<p class="lesson-example">
  Example Test: If the values of <code>$s0</code> through <code>$s3</code> and Memory
  contents are initialized in the simulator as:
</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Data</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>4000</td></tr>
      <tr><td>$s1</td><td>8000</td></tr>
      <tr><td>$s2</td><td>2</td></tr>
      <tr><td>$s3</td><td>0</td></tr>
    </tbody>
  </table>
</div>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Addresses</th><th>Contents</th></tr>
    </thead>
    <tbody>
      <tr><td>8000</td><td>230</td></tr>
      <tr><td>4000</td><td>4</td></tr>
      <tr><td>4004</td><td>3848</td></tr>
      <tr><td>3848</td><td>-15</td></tr>
      <tr><td>3852</td><td>6104</td></tr>
      <tr><td>6104</td><td>-10</td></tr>
      <tr><td>6108</td><td>5008</td></tr>
      <tr><td>5008</td><td>0</td></tr>
      <tr><td>5012</td><td>4500</td></tr>
      <tr><td>4500</td><td>40</td></tr>
      <tr><td>4504</td><td>0</td></tr>
    </tbody>
  </table>
</div>

<p>The resultant registers are:</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Data</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>4000</td></tr>
      <tr><td>$s1</td><td>8000</td></tr>
      <tr><td>$s2</td><td>2</td></tr>
      <tr><td>$s3</td><td>230</td></tr>
    </tbody>
  </table>
</div>

<p>The resultant array is:</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Addresses</th><th>Contents</th></tr>
    </thead>
    <tbody>
      <tr><td>8000</td><td>230</td></tr>
      <tr><td>8004</td><td>6104</td></tr>
      <tr><td>4000</td><td>4</td></tr>
      <tr><td>4004</td><td>3848</td></tr>
      <tr><td>3848</td><td>-15</td></tr>
      <tr><td>3852</td><td>8000</td></tr>
      <tr><td>6104</td><td>-10</td></tr>
      <tr><td>6108</td><td>5008</td></tr>
      <tr><td>5008</td><td>0</td></tr>
      <tr><td>5012</td><td>4500</td></tr>
      <tr><td>4500</td><td>40</td></tr>
      <tr><td>4504</td><td>0</td></tr>
    </tbody>
  </table>
</div>
`,
  testCases: [
    {
      name: "Test 1: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 4000,
        "$s1": 8000,
        "$s2": 2,
        "$s3": 0
      },
      initialMemory: {
        4000: 4,
        4004: 3848,
        3848: -15,
        3852: 6104,
        6104: -10,
        6108: 5008,
        5008: 0,
        5012: 4500,
        4500: 40,
        4504: 0,
        8000: 230
      },
      expectedRegisters: {
        "$s0": 4000,
        "$s1": 8000,
        "$s2": 2,
        "$s3": 230
      },
      expectedMemory: {
        3848: -15,
        3852: 8000,
        4000: 4,
        4004: 3848,
        4500: 40,
        4504: 0,
        5008: 0,
        5012: 4500,
        6104: -10,
        6108: 5008,
        8000: 230,
        8004: 6104
      }
    },
    {
      name: "Test 2: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 13804,
        "$s1": 4000,
        "$s2": 0,
        "$s3": 0
      },
      initialMemory: {
        13804: -8,
        13808: 8000,
        8000: 80,
        8004: 0,
        4000: -230
      },
      expectedRegisters: {
        "$s0": 4000,
        "$s1": 4000,
        "$s2": 0,
        "$s3": -230
      },
      expectedMemory: {
        4000: -230,
        4004: 13804,
        8000: 80,
        8004: 0,
        13804: -8,
        13808: 8000
      }
    },
    {
      name: "Test 3: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 8016,
        "$s1": 13000,
        "$s2": 100,
        "$s3": 0
      },
      initialMemory: {
        8016: -50,
        8020: 8040,
        4024: 100,
        4028: 6032,
        6032: -80,
        6036: 0,
        8040: -100,
        8044: 4024,
        13000: 0
      },
      expectedRegisters: {
        "$s0": 8016,
        "$s1": 13000,
        "$s2": 100,
        "$s3": 0
      },
      expectedMemory: {
        4024: 100,
        4028: 6032,
        6032: -80,
        6036: 13000,
        8016: -50,
        8020: 8040,
        8040: -100,
        8044: 4024,
        13000: 0,
        13004: 0
      }
    },
    {
      name: "Test 4: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 10000,
        "$s1": 4024,
        "$s2": 3,
        "$s3": 0
      },
      initialMemory: {
        10000: 23,
        10004: 5008,
        5008: -5,
        5012: 8016,
        8016: 20,
        8020: 0,
        4024: 30
      },
      expectedRegisters: {
        "$s0": 10000,
        "$s1": 4024,
        "$s2": 3,
        "$s3": 30
      },
      expectedMemory: {
        4024: 30,
        4028: 0,
        5008: -5,
        5012: 8016,
        8016: 20,
        8020: 4024,
        10000: 23,
        10004: 5008
      }
    }
  ]
},

"lab-12-16": {
  title: "12.16 Zylab 5 - Recursive Procedure Call",
  html: `
<p>
  Write a MIPS program using <strong>Recursive Procedure Execution</strong> to perform the
  following tasks: <strong>Note:</strong> If your code runs perfectly, but you didn't use
  Procedure Execution correctly, you will be given zero points.
</p>

<p>Write the following functions in MIPS.</p>

<ul>
  <li>
    <strong>main</strong>
    <ul>
      <li>inputs: integers a, b</li>
      <li>task: Compute the integer: <code>a * F(|a+b|, |a-b|) - b * F(|b-a|, |b+a|)</code>.</li>
    </ul>
  </li>
  <li>
    <strong>recursion F(x, y)</strong>
    <ul>
      <li>inputs: integers x, y.</li>
      <li>task:
        <pre>
F(x, y) = F(x-1, y) + F(x, y-1), if x, y > 0
F(x, y) = y if x <= 0, y > 0
F(x, y) = x if y <= 0, x > 0
F(x, y) = 0 if x, y <= 0
        </pre>
      </li>
    </ul>
  </li>
</ul>

<p>
  Following is a sample C code segment. You may modify the code for the functions, but the
  task performed should not be changed, i.e., you should use recursive procedure calls.
</p>

<pre>
int main(int a, int b) {
    int result = a * recursion(abs(a+b), abs(a-b)) - b * recursion(abs(b-a), abs(b+a));
}

int recursion(int x, int y) {
   if (x <= 0 && y <= 0)
       return(0);
   else if (x > 0 && y <= 0)
       return(x);
   else if (x <= 0 && y > 0)
       return(y);
   else
       return(recursion(x-1, y) + recursion(x, y-1));
}
</pre>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Variables</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>a</td></tr>
      <tr><td>$s1</td><td>b</td></tr>
      <tr><td>$s2</td><td>result</td></tr>
    </tbody>
  </table>
</div>

<p class="lesson-example">
  Example Test: If the values of <code>$s1</code> and <code>$s2</code> are initialized in
  the simulator as:
</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Data</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>1</td></tr>
      <tr><td>$s1</td><td>2</td></tr>
      <tr><td>$s2</td><td>0</td></tr>
    </tbody>
  </table>
</div>

<p>The resultant registers are:</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Data</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>1</td></tr>
      <tr><td>$s1</td><td>2</td></tr>
      <tr><td>$s2</td><td>-7</td></tr>
    </tbody>
  </table>
</div>
`,
  testCases: [
    {
      name: "Test 1: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 1,
        "$s1": 2,
        "$s2": 0
      },
      expectedRegisters: {
        "$s0": 1,
        "$s1": 2,
        "$s2": -7
      }
    },
    {
      name: "Test 2: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 4,
        "$s1": 2,
        "$s2": 0
      },
      expectedRegisters: {
        "$s0": 4,
        "$s1": 2,
        "$s2": 128
      }
    },
    {
      name: "Test 3: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 230,
        "$s1": 230,
        "$s2": 0
      },
      expectedRegisters: {
        "$s0": 230,
        "$s1": 230,
        "$s2": 0
      }
    },
    {
      name: "Test 4: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 4,
        "$s1": 0,
        "$s2": 0
      },
      expectedRegisters: {
        "$s0": 4,
        "$s1": 0,
        "$s2": 448
      }
    }
  ]
},

"lab-12-17": {
  title: "12.17 ZyLab 6 - MIPS Recursive Multiplication",
  html: `
<p>
  Write a MIPS program to compute the product of two 16-bit signed numbers using
  <em>recursive procedure calls</em>.
  <strong>Note:</strong> You CANNOT use the <code>mult</code> or <code>mul</code>
  instructions. You should use Procedure Execution for full credit. If your test cases
  pass but you have not used Procedure execution, you will receive only half the points
  (at most 2 points).
</p>

<p>
  Given the multiplicand (<code>md</code>) and multiplier (<code>m</code>) as inputs,
  write the <strong>main</strong> and <strong>recursion</strong> functions to compute
  the product (<code>p</code>) using the shift and add recursive algorithm for
  multiplication.
</p>

<p>Write the following functions in MIPS.</p>

<ul>
  <li>
    <strong>main</strong>
    <ul>
      <li>
        task: initialize product, multiplicand and multiplier registers and call the
        recursion function with iteration number equal to the size of numbers (16-bit).
      </li>
      <li>
        Note: If numbers are negative, convert to positive numbers and then multiply.
        Add sign separately at the end. Do not convert the original input registers,
        only convert the argument registers sent to the recursion function.
      </li>
    </ul>
  </li>

  <li>
    <strong>recursion</strong>
    <ul>
      <li>
        inputs: product (p), multiplicand (md) and multiplier (m) registers and the
        iteration number (n).
      </li>
      <li>
        task: compute the nth iterative step of multiplication, call recursion function
        by decrementing n and return if n = 0.
      </li>
      <li>outputs: updated product (p).</li>
    </ul>
  </li>
</ul>

<p>
  Refer to the binary shift and add multiplication algorithm discussed in class. While
  writing the code,
</p>

<p>
  Following is a sample C code segment. You may modify the code for the functions, but
  the task performed should not be changed, i.e., you should use recursive procedure
  calls.
</p>

<pre>
// multiplier and multiplicand are inputs (For compilable C code, you should use argc and argv for command line inputs)
int main(int m, int md) {         
    // Initializing Arguments
    int sign_p = 0;
     // negate the operands if negative 
    if (m < 0 and md > 0) or (m > 0 and md < 0)
         sign_p = 1;
    if (m < 0)   
        arg_m = - m;     // Modify Argument not Given Register
    if (md < 0)    
        arg_md = - md;    // Modify Argument not Given Register
    int p = recursion(0, arg_md, arg_m, 16);     // 16-bit unsigned multiplication => recursion 16 times
    if (sign_p == 1)
        p = - p;        // negate if one of the operands is negative
}

int recursion(int p, int md, int m, int n) {
    if (n == 0) 
        return(p);
    else {
        int m_0 = m & 1;    // 0th or least significant bit of multiplier
        if (m_0  == 1)
              p = p + md;
        m = m >> 1;
        md = md << 1;     
        p = recursion(p, md, m, n-1);         // updated values of p, md and m - arguments
        return(p);
    }
}
</pre>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Variables</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>product</td></tr>
      <tr><td>$s1</td><td>multiplicand</td></tr>
      <tr><td>$s2</td><td>multiplier</td></tr>
    </tbody>
  </table>
</div>

<p>
  Example Test: If the values of <code>$s1</code> and <code>$s2</code> are initialized in
  the simulator as:
</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Data</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>0</td></tr>
      <tr><td>$s1</td><td>8000</td></tr>
      <tr><td>$s2</td><td>15000</td></tr>
    </tbody>
  </table>
</div>

<p>The resultant registers are:</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Data</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>120000000</td></tr>
      <tr><td>$s1</td><td>8000</td></tr>
      <tr><td>$s2</td><td>15000</td></tr>
    </tbody>
  </table>
</div>
`,
  testCases: [
    {
      name: "Test 1: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 0,
        "$s1": 8000,
        "$s2": 15000
      },
      expectedRegisters: {
        "$s0": 120000000,
        "$s1": 8000,
        "$s2": 15000
      }
    },
    {
      name: "Test 2: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 0,
        "$s1": -230,
        "$s2": 11012
      },
      expectedRegisters: {
        "$s0": -2532760,
        "$s1": -230,
        "$s2": 11012
      }
    },
    {
      name: "Test 3: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 0,
        "$s1": -23011,
        "$s2": -23012
      },
      expectedRegisters: {
        "$s0": 529529132,
        "$s1": -23011,
        "$s2": -23012
      }
    },
    {
      name: "Test 4: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 0,
        "$s1": 23012,
        "$s2": -11023
      },
      expectedRegisters: {
        "$s0": -253661276,
        "$s1": 23012,
        "$s2": -11023
      }
    }
  ]
},

"lab-12-18": {
  title: "12.18 Zylab 7 - MIPS Procedure Execution",
  html: `
<p>
  Given an array of at least one integer, write a program to create a new array with
  elements equal to the exponent of each element in the original array raised to the
  index, i.e., <code>B[i] = sum of 1st i elements of A</code>.
</p>

<p>
  For this, write the following two functions using <strong>Procedure Execution</strong>.
  (If procedure execution or functions are not used, you will receive a score of 0, even
  if the tests pass).
</p>

<ul>
  <li>
    <strong>main</strong>
    <ul>
      <li>task: Create array B by obtaining the sum from the nSum function.</li>
    </ul>
  </li>
  <li>
    <strong>nSum</strong>
    <ul>
      <li>inputs: base address of array A (<code>*A</code>), index of B (<code>k</code>)</li>
      <li>
        task: compute the sum of 1st <code>k</code> elements of array A.
        (If array A elements are overwritten, the updated values should be used.)
      </li>
      <li>return: sum of 1st <code>k</code> elements of array A.</li>
    </ul>
  </li>
</ul>

<p>
  Following is a sample C code to perform the required task. You may modify the code for
  the functions, but the task performed should not be changed.
</p>

<pre>
int main() {
    // Variable Declaration
    int* A, B;      // Base addresses of A and B
    int n;          // Length of arrays A and B

    // Task of main function
    for (int j = 0; j < n; j++) {
        B[j] = nSum(A, j);
    }
}

int nSum(int* A, int k) {
    int sum = A[0];
    for (int j = 1; j <= k; j++) {
        sum = sum + A[j];
    }
    return(sum);
}
</pre>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Variables</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>A</td></tr>
      <tr><td>$s1</td><td>B</td></tr>
      <tr><td>$s2</td><td>n</td></tr>
    </tbody>
  </table>
</div>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Addresses</th><th>Contents</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>A[0]</td></tr>
      <tr><td>$s0+4</td><td>A[1]</td></tr>
      <tr><td>…</td><td>…</td></tr>
      <tr><td>$s0+4*(n-1)</td><td>A[n-1]</td></tr>
    </tbody>
  </table>
</div>

<p>
  Example Test: If the values of <code>$s1</code> through <code>$s7</code> are initialized
  in the simulator as:
</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Registers</th><th>Data</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>4000</td></tr>
      <tr><td>$s1</td><td>8000</td></tr>
      <tr><td>$s2</td><td>5</td></tr>
    </tbody>
  </table>
</div>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Addresses</th><th>Contents</th></tr>
    </thead>
    <tbody>
      <tr><td>4000</td><td>10</td></tr>
      <tr><td>4004</td><td>5</td></tr>
      <tr><td>4008</td><td>-5</td></tr>
      <tr><td>4012</td><td>-2</td></tr>
      <tr><td>4016</td><td>0</td></tr>
    </tbody>
  </table>
</div>

<p>The resultant array B is:</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Addresses</th><th>Contents</th></tr>
    </thead>
    <tbody>
      <tr><td>8000</td><td>10</td></tr>
      <tr><td>8004</td><td>15</td></tr>
      <tr><td>8008</td><td>10</td></tr>
      <tr><td>8012</td><td>8</td></tr>
      <tr><td>8016</td><td>8</td></tr>
    </tbody>
  </table>
</div>
`,
  testCases: [
    {
      name: "Test 1: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 4000,
        "$s1": 8000,
        "$s2": 5
      },
      initialMemory: {
        4000: 10,
        4004: 5,
        4008: -5,
        4012: -2,
        4016: 0
      },
      expectedMemory: {
        8000: 10,
        8004: 15,
        8008: 10,
        8012: 8,
        8016: 8
      }
    },
    {
      name: "Test 2: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 13800,
        "$s1": 13804,
        "$s2": 1
      },
      initialMemory: {
        13800: -8
      },
      expectedMemory: {
        13804: -8
      }
    },
    {
      name: "Test 3: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 8016,
        "$s1": 8000,
        "$s2": 10
      },
      initialMemory: {
        8016: -5,
        8020: 8,
        8024: 4,
        8028: -6,
        8032: 6,
        8036: -10,
        8040: -8,
        8044: 2,
        8048: 8,
        8052: -8
      },
      expectedMemory: {
        8000: -5,
        8004: 3,
        8008: 7,
        8012: 1,
        8016: 7,
        8020: -3,
        8024: -11,
        8028: -9,
        8032: -1,
        8036: -9
      }
    },
    {
      name: "Test 4: Compare storage (1 point)",
      points: 1,
      initialRegisters: {
        "$s0": 2648,
        "$s1": 2648,
        "$s2": 8
      },
      initialMemory: {
        2648: -8,
        2652: 4,
        2656: 15,
        2660: 12,
        2664: 12,
        2668: 10,
        2672: 8,
        2676: 14
      },
      expectedMemory: {
        2648: -8,
        2652: -4,
        2656: 11,
        2660: 23,
        2664: 35,
        2668: 45,
        2672: 53,
        2676: 67
      }
    }
  ]
}
};

// ── DIAGNOSTIC: fires after module evaluates ──
console.log("[MIPS DEBUG] lessons.js loaded. LESSONS keys:", Object.keys(LESSONS));