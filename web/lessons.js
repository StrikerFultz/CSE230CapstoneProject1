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
`
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
  }
};
