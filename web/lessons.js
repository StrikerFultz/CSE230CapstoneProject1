export const LESSONS = {
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

<p class="lesson-example">
  Note: Use the <strong>+</strong> button under the Registers display to initialize
  <code>$s1</code> through <code>$s7</code>.
</p>
`
  },

"lab-12-12": {
    title: "12.12 ZyLab 1 - ALU and Data Transfer Instructions",
    html: `
<p style="text-align:center">
  Given an array of 2 integers, write a MIPS program to implement some ALU operations
  and store the results back to memory. The C code below shows how the elements are appended
  to the array:
</p>

<pre>
// Declaration of variables
int* A;          // Integer array A with the base address pointing to variable A
int a;
char b, c;
short d;

// Append array elements
{A[2], A[4]} = A[1] * A[0];        // {} = concatenation / append. 64-bit product should be stored in Array
A[5] = A[4] / 230;
a = A[4] % 230;
b = a >> 16;                     // '>>' = right shift
c = (a & 0b'1000) | (b | 0b'0011); // '&' = bit-wise and
d = a << 2;                      // '<<' = left shift
A[6] = {b, c, d};                // {} = concatenation / append. Use Memory Operations (identify the correct address to place c and d in Array)
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
      <tr><td>$s0 + 4</td><td>A[1]</td></tr>
    </tbody>
  </table>
</div>

<p class="lesson-example">
  You may use any temporary registers from <code>$t0</code> to <code>$t9</code> or
  saved registers from <code>$s1</code> to <code>$s7</code>.
  Clearly specify your choice of registers and explain your code using comments.
</p>

<p class="lesson-example">
  Example Test: If the value of <code>$s0</code> and Memory are initialized in the simulator as below: (Use the '+' button under the Registers display to initialize register values for <code>$s0</code> and the '+' button under the Memory display to initialize the first two array elements.)
</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Register</th><th>Data</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>8016</td></tr>
    </tbody>
  </table>
</div>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Address</th><th>Contents</th></tr>
    </thead>
    <tbody>
      <tr><td>8016</td><td>-5</td></tr>
      <tr><td>8020</td><td>8</td></tr>
    </tbody>
  </table>
</div>

<p class="lesson-example">
  The resultant array is:
</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Address</th><th>Contents</th></tr>
    </thead>
    <tbody>
      <tr><td>8016</td><td>-5</td></tr>
      <tr><td>8020</td><td>8</td></tr>
      <tr><td>8024</td><td>7</td></tr>
      <tr><td>8028</td><td>-64</td></tr>
      <tr><td>8032</td><td>-40</td></tr>
      <tr><td>8036</td><td>0</td></tr>
      <tr><td>8040</td><td>-160</td></tr>
    </tbody>
  </table>
</div>

<p class="lesson-example">
  <strong>Note:</strong> Only the register <code>$s0</code> and the 6 elements in memory
  will be checked by the automated tests.
</p>
`
  },

"lab-12-13": {
    title: "12.13 Zylab 2 - Loops (Conditional and Unconditional Branch Instructions)",
    html: `
<p style="text-align:center">
  To save some space in Memory, I would like to remove duplicate data, for example duplicate student ID numbers. 
  Towards this, let us consider an array which may contain duplicates. 
  Here we will consider the data to be small integers. The same code can be used for large integer values.
</p>

<p style="text-align:center">
  Given an array (base address and number of elements), write a MIPS program to do the following:
</p>

<ul>
  <li>Delete all duplicate elements.</li>
  <li>The final array should contain unique integers only.</li>
  <li>The size of the array should be updated after deleting duplicates.</li>
</ul>

<p class="lesson-example">
  Below is an example of the C code segment to perform the above task. You may use a different code, but you have to write the code that you use as a comment before the MIPS code.
</p>

<pre>
// Declaration of variables
int* Array;     // Base address of array A
int size;       // Length of the array A
int i, j, k;    // Given value to be removed from array

// Remove elements equal to val
i = 0;
while (i < size) {
  j = i + 1;
  while (j < size) {
    if (Array[i] == Array[j]) {
      for (k = j; k < size - 1; k++) {    // Shift elements if element is less than value
        Array[k] = Array[k + 1];
      }
      size = size - 1;    // if element deleted, length of array decreases
    }
    else {
      j++;
    }
  }
  i++;
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
      <tr><td>$s0 + 4</td><td>Array[1]</td></tr>
      <tr><td>$s0 + 8</td><td>Array[2]</td></tr>
      <tr><td>...</td><td>...</td></tr>
      <tr><td>$s0 + 4*(size-1)</td><td>Array[n-1]</td></tr>
    </tbody>
  </table>
</div>

<p style="font-weight:600;">
  You may use any temporary registers from <code>$t0</code> to <code>$t9</code> or
  saved registers from <code>$s2</code> to <code>$s7</code>.
  Clearly specify your choice of registers and explain your code using comments.
</p>

<p class="lesson-example">
  Example Test: If the values of <code>$s0</code> through <code>$s1</code> and array elements are initialized in the simulator as:
</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Register</th><th>Data</th></tr>
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
      <tr><th>Address</th><th>Contents</th></tr>
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

<p class="lesson-example">
  The resultant registers are:
</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Register</th><th>Data</th></tr>
    </thead>
    <tbody>
      <tr><td>$s0</td><td>4000</td></tr>
      <tr><td>$s1</td><td>4</td></tr>
    </tbody>
  </table>
</div>

<p class="lesson-example">
  The resultant array is:
</p>

<div class="center-table">
  <table>
    <thead>
      <tr><th>Address</th><th>Contents</th></tr>
    </thead>
    <tbody>
      <tr><td>4000</td><td>4</td></tr>
      <tr><td>4004</td><td>8</td></tr>
      <tr><td>4008</td><td>-13</td></tr>
      <tr><td>4012</td><td>0</td></tr>
    </tbody>
  </table>
</div>

<p class="lesson-example">
  <strong>Note:</strong> Only the registers <code>$s0</code>, <code>$s1</code> and
  the first <code>$s1</code> elements in memory will be checked by the automated tests.
</p>
`
  },

"lab-12-14": {
    title: "12.14 ZyLab 3 - Single Procedure Call",
    html: `
<p>
  Given an array of at least one integer, write a program to create a new array with
  elements equal to the power of each element in the original array raised to the
  index, i.e. P[i] = A[i]^i.
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
      <li>inputs: base address of new array P (%p), current size of P (variable k) and the new element (A[i]^i)</li>
      <li>task: add the new element at the end.</li>
      <li>This function does not return any value (void).</li>
    </ul>
  </li>
</ul>

<p>
  Following is a sample C code to perform the required task. You may modify the code
  for the functions, but the task performed should not be changed.
</p>

<pre>
int main() {
  // Variable Declaration
  int *A, *P;   // Base addresses of A and P
  int n, k;     // Lengths of arrays A and B
  int pow;      // Return value from power function

  // Task of main function
  P[0] = 1;     // 0th element = x^0 = 1

  for (int i = 1; i < n; i++) {
    k = i;                // Current length of array P
    pow = power(A[i], i);
    newElement(P, k, pow);
  }
  k++;
}

int power(int a, int b) {
  int pow = a;
  for (int i = 1; i < b; i++) {
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
      <tr><td>...</td><td>...</td></tr>
      <tr><td>$s0+4*(n-1)</td><td>A[n-1]</td></tr>
    </tbody>
  </table>
</div>

<p>
  Example Test: If the values of <code>$s1</code> through <code>$s7</code> are initialized in the simulator as:
  (Use the '+' button under the Registers display to initialize register values for
  <code>$s0</code>, <code>$s1</code>, <code>$s2</code> and the '+' button under the Memory display to initialize the A array elements.)
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
`
  },

  "lab-12-15": {
  title: "12.15 ZyLab 4 - Nested Procedure Call",
  html: `
<p>
  Write a MIPS program to add a given node in a linked list at the specified location,
  using Nested Procedure Calls. If your code runs perfectly, but you did not use
  Procedure Execution correctly, you will be given zero points.
</p>

<p>Given Inputs:</p>
<ul>
  <li>the head of linked list, i.e. address of the start (first node) of the list</li>
  <li>location: number of node in the linked list after which node is to be added (0 to add before the 1st node, 1 to add after 1st node and so on.)</li>
  <li>the address of the node to be inserted AND each node contains:</li>
  <li>an integer value</li>
  <li>address to the next node (address is NULL (0) if it is the last node in the list)</li>
</ul>

<p>
  Write the following three functions that will be called in order to update the linked
  list by adding the new node.
</p>

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
      <li>task: calls the findNode function and add the node after the n’th node in the linked list. If the number is greater than the size of list, then add the node at the end of the list.</li>
      <li>output: value of the inserted node.</li>
    </ul>
  </li>

  <li>
    <strong>findNode</strong>
    <ul>
      <li>inputs: head of linked list (head) and location to add node (n)</li>
      <li>task: navigate the linked list to find the addresses of the n’th and (n+1)’th nodes</li>
      <li>outputs: addresses of the n’th and (n+1)’th nodes.</li>
    </ul>
  </li>
</ul>

<p>
  Following is a sample C code segment to perform the required task. (this code is
  incomplete and does not include creating the linked list or a new node, so you cannot
  compile it using any C compiler). You may modify the code for the functions, but the
  task performed should not be changed.
</p>

<pre>
// Parameters of a node in the linked list (need not declare or initialize in MIPS)
typedef struct node {
    int value;     // Value in the node accessed by node->value
    node* next;    // Address of next node accessed by node->next
} node;            // Datatype for each node

node *head;        // Address of head (first node) of linked list (global pointer)

int main() {
    // Variable Declaration
    node *newNode; // Address of node to be added
    int n;         // Number of the node in the list after which node is to be added
    int value;     // Value of the node to be added

    // Task of main function
    value = addNode(head, n, newNode);
}

int addNode(node* head, int n, node* newNode) {
    node *addr1, *addr2;        // addr1 = address of n^th node, addr2 = address of (n+1)^th node
    if (n == 0 || head == 0) {  // If node should be added at the beginning of the list
        newNode->next = head;   // Next for new node = head of original list
        head = newNode;         // global head updated to the new node
        return(newNode->value); // value of the node = data at the address of the node, and then return to caller
    }
    else {
        [addr1, addr2] = findNode(head, n);   // Call findNode function
        addr1->next = newNode;                // Next for n^th node = node to be added
        newNode->next = addr2;                // Next for added node = (n+1)^th node of original list
        return(newNode->value);               // value of the node = data at the address of the node
    }
}

node* findNode(node* head, int n) {
    node* curr = head;                  // Start with head of linked list
    for (int i = 1; i < n; i++) {
        curr = curr->next;              // Update the pointer to next node address
        if (curr == 0)                  // Break if end of List
            break;
        if (curr->next == 0)            // Break if end of List
            break;
    }
    return(curr, curr->next);           // Two return values (need not return as array in MIPS)
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

<p>
  Linked List and New Node in Memory:
</p>

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
      <tr><td>...</td><td>...</td></tr>
    </tbody>
  </table>
</div>

<p>
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
`
},

"lab-12-16": {
  title: "12.16 ZyLab 5 - Recursive Procedure Call",
  html: `
<p>
  Write a MIPS program using <em>Recursive Procedure Execution</em> to perform the
  following tasks: <strong>Note:</strong> If your code runs perfectly, but you didn't
  use Procedure Execution correctly, you will be given zero points.
</p>

<p>Write the following functions in MIPS.</p>

<ul>
  <li>
    <strong>main</strong>
    <ul>
      <li>inputs: integers a, b</li>
      <li>
        task: Compute the integer:
        <code>a * F(|a+b|, |a-b|) - b * F(|b-a|, |b+a|)</code>.
      </li>
    </ul>
  </li>

  <li>
    <strong>recursion F(x, y)</strong>
    <ul>
      <li>inputs: integers x, y</li>
      <li>task:</li>
    </ul>
  </li>
</ul>

<pre>
F(x, y) = F(x-1, y) + F(x, y-1), if x, y > 0
F(x, y) = y if x <= 0, y > 0
F(x, y) = x if y <= 0, x > 0
F(x, y) = 0 if x, y <= 0
</pre>

<p>
  Following is a sample C code segment. You may modify the code for the functions, but
  the task performed should not be changed, i.e., you should use recursive procedure
  calls.
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
`
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
`
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
`
}
};

// ── DIAGNOSTIC: fires after module evaluates ──
console.log("[MIPS DEBUG] lessons.js loaded. LESSONS keys:", Object.keys(LESSONS));