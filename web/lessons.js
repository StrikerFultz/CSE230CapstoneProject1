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
  }
};
