export const LESSONS = {
    //lab 12.2
    "lab-12-2": {
  title: "12.2 LAB: Arithmetic expression - add/sub",
  html: `
<p style="text-align:center">
  Given the mapping of registers to variables below, write a program to implement the following expression:
</p><b>
<p style="text-align:center">
        Z = A + B + C - D
        </p></b>

<p style="text-align:center; font-weight:600;">Use only <code>$t0</code> as a temporary register during implementation.</p>

<div class="center-table">
  <table>
    <thead><tr><th>Registers</th><th>Variables</th></tr></thead>
    <tbody>
      <tr><td>$s0</td><td>A</td></tr>
      <tr><td>$s1</td><td>B</td></tr>
      <tr><td>$s2</td><td>C</td></tr>
      <tr><td>$s3</td><td>D</td></tr>
      <tr><td>$s4</td><td>Z</td></tr>
    </tbody>
  </table>
</div>

<p class="lesson-example"><strong>Ex:</strong> If the values of $s0, $s1, $s2, and $s3 are initialized in the simulator as:</p>

<div class="center-table">
  <table>
    <thead><tr><th>Registers</th><th>Data</th></tr></thead>
    <tbody>
      <tr><td>$s0</td><td>2</td></tr>
      <tr><td>$s1</td><td>4</td></tr>
      <tr><td>$s2</td><td>6</td></tr>
      <tr><td>$s3</td><td>5</td></tr>
    </tbody>
  </table>
</div>

<p class="lesson-example">the result is stored in <code>$s4</code>:</p>

<div class="center-table">
  <table>
    <thead><tr><th>Registers</th><th>Data</th></tr></thead>
    <tbody>
      <tr><td>$s0</td><td>2</td></tr>
      <tr><td>$s1</td><td>4</td></tr>
      <tr><td>$s2</td><td>6</td></tr>
      <tr><td>$s3</td><td>5</td></tr>
      <tr><td>$s4</td><td>7</td></tr>
    </tbody>
  </table>
</div>
`
},

//lesson 12.3
 "lab-12-3": {
    title: "12.3 LAB: Arithmetic expression - add/sub/mult",
    html: `
<p style="text-align:center">Given the mapping of registers to variables below, write a program to implement the following expression:</p>
<p style="text-align:center">
        Z = (A + B) x (C - D)
        </p></b>

<div class="center-table">
  <table>
    <thead><tr><th>Registers</th><th>Variables</th></tr></thead>
    <tbody>
      <tr><td>$s0</td><td>A</td></tr>
      <tr><td>$s1</td><td>B</td></tr>
      <tr><td>$s2</td><td>C</td></tr>
      <tr><td>$s3</td><td>D</td></tr>
      <tr><td>$s4</td><td>Z</td></tr>
    </tbody>
  </table>
</div>

<p class="lesson-example"><strong>Ex:</strong> If the values are initialized as:</p>
<div class="center-table">
  <table>
    <thead><tr><th>Registers</th><th>Data</th></tr></thead>
    <tbody>
      <tr><td>$s0</td><td>2</td></tr>
      <tr><td>$s1</td><td>4</td></tr>
      <tr><td>$s2</td><td>6</td></tr>
      <tr><td>$s3</td><td>3</td></tr>
    </tbody>
  </table>
</div>

<p class="lesson-example">the result is stored in <code>$s4</code>:</p>
<div class="center-table">
  <table>
    <thead><tr><th>Registers</th><th>Data</th></tr></thead>
    <tbody>
      <tr><td>$s0</td><td>2</td></tr>
      <tr><td>$s1</td><td>4</td></tr>
      <tr><td>$s2</td><td>6</td></tr>
      <tr><td>$s3</td><td>3</td></tr>
      <tr><td>$s4</td><td>18</td></tr>
    </tbody>
  </table>
</div>

` },
};
