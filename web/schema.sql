--
-- PostgreSQL database dump
--

\restrict KmCGiyOnhdshy4aAV31YJBFCvEs6q6d1lrQcJNJaheB3yjkCJ23n10D9QwZvdNj

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    course_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    course_code character varying(20) NOT NULL,
    course_name character varying(255) NOT NULL,
    description text,
    semester character varying(20) NOT NULL,
    year integer NOT NULL,
    is_active boolean DEFAULT true
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollments (
    enrollment_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    course_id uuid NOT NULL,
    role character varying(20) NOT NULL,
    enrolled_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    dropped_at timestamp with time zone
);


ALTER TABLE public.enrollments OWNER TO postgres;

--
-- Name: lab_test_cases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lab_test_cases (
    test_case_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    lab_id character varying(50) NOT NULL,
    test_name character varying(255) NOT NULL,
    test_type character varying(20) NOT NULL,
    description text,
    input_data jsonb DEFAULT '{}'::jsonb,
    expected_output jsonb NOT NULL,
    points integer DEFAULT 10,
    is_hidden boolean DEFAULT false,
    timeout_seconds integer DEFAULT 5
);


ALTER TABLE public.lab_test_cases OWNER TO postgres;

--
-- Name: labs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.labs (
    lab_id character varying(50) NOT NULL,
    course_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    instructions text NOT NULL,
    starter_code text,
    solution_code text,
    register_mapping jsonb DEFAULT '{}'::jsonb,
    initial_values jsonb DEFAULT '{}'::jsonb,
    max_memory_kb integer DEFAULT 1024,
    time_limit_seconds integer DEFAULT 10,
    max_instructions integer DEFAULT 10000,
    total_points integer DEFAULT 100,
    release_date timestamp with time zone,
    due_date timestamp with time zone,
    is_published boolean DEFAULT false,
    difficulty character varying(20) DEFAULT 'intermediate'::character varying
);


ALTER TABLE public.labs OWNER TO postgres;

--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_preferences (
    preference_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    theme character varying(20) DEFAULT 'light'::character varying,
    editor_font_size integer DEFAULT 14,
    auto_save_enabled boolean DEFAULT true,
    additional_preferences jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.user_preferences OWNER TO postgres;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    session_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    session_token character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    ip_address inet,
    user_agent text
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp with time zone,
    is_active boolean DEFAULT true,
    full_name character varying(255),
    asu_id character varying(20)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (course_id, course_code, course_name, description, semester, year, is_active) FROM stdin;
2d0387d8-8ce1-46ce-b39a-4c22e10fda93	CSE240	Introduction to Programming Languages	CSE240 covers MIPS assembly programming, computer organization, and low-level programming concepts including arithmetic operations, memory management, control flow, and procedure calling conventions.	Spring	2025	t
\.


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollments (enrollment_id, user_id, course_id, role, enrolled_at, dropped_at) FROM stdin;
\.


--
-- Data for Name: lab_test_cases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lab_test_cases (test_case_id, lab_id, test_name, test_type, description, input_data, expected_output, points, is_hidden, timeout_seconds) FROM stdin;
\.


--
-- Data for Name: labs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.labs (lab_id, course_id, title, description, instructions, starter_code, solution_code, register_mapping, initial_values, max_memory_kb, time_limit_seconds, max_instructions, total_points, release_date, due_date, is_published, difficulty) FROM stdin;
lab-12-2	2d0387d8-8ce1-46ce-b39a-4c22e10fda93	LAB: Arithmetic expression - add/sub	Write a MIPS program to evaluate Z = A + B + C - D using only add and sub instructions, with $t0 as the only temporary register.	Given the mapping of registers to variables below, write a program to implement the following expression:\n\n  Z = A + B + C - D\n\nUse only $t0 as a temporary register during implementation.\n\nRegister Mapping:\n  $s0 = A\n  $s1 = B\n  $s2 = C\n  $s3 = D\n  $s4 = Z\n\nInitial Values:\n  $s0 (A) = 2\n  $s1 (B) = 4\n  $s2 (C) = 6\n  $s3 (D) = 3\n  $s4 (Z) = ?\n\nHint: Think of this as Z = ((A + B) + C) - D and build it up in $t0 one step at a time.\n\nWhen your program finishes, the value in $s4 should hold Z.	# LAB 12.2 - Arithmetic Expression: add/sub\n# Z = A + B + C - D\n# $s0=A, $s1=B, $s2=C, $s3=D, $s4=Z\n# Use only $t0 as a temporary register\n\n# Write your code below\n	\N	{"$s0": "A", "$s1": "B", "$s2": "C", "$s3": "D", "$s4": "Z"}	{"$s0": 2, "$s1": 4, "$s2": 6, "$s3": 3, "$s4": 0}	64	30	100	100	2026-02-28 17:02:57.478099-07	\N	t	beginner
lab-12-3	2d0387d8-8ce1-46ce-b39a-4c22e10fda93	LAB: Arithmetic expression - add/sub/mult	Write a MIPS program to evaluate Z = (A + B) * (C - D) using add, sub, and mult instructions.	Given the mapping of registers to variables below, write a program to implement the following expression:\n\n  Z = (A + B) * (C - D)\n\nRegister Mapping:\n  $s0 = A\n  $s1 = B\n  $s2 = C\n  $s3 = D\n  $s4 = Z\n\nRemember:\n  - Use add to compute (A + B) into a temporary register\n  - Use sub to compute (C - D) into a temporary register\n  - Use mult to multiply the two results\n  - Use mflo to move the lower 32 bits of the product into $s4\n\nWhen your program finishes, the value in $s4 should hold Z.	# LAB 12.3 - Arithmetic Expression: add/sub/mult\n# Z = (A + B) * (C - D)\n# $s0=A, $s1=B, $s2=C, $s3=D, $s4=Z\n\n# Write your code below\n	\N	{"$s0": "A", "$s1": "B", "$s2": "C", "$s3": "D", "$s4": "Z"}	{"$s0": 0, "$s1": 0, "$s2": 0, "$s3": 0, "$s4": 0}	64	30	100	100	2026-02-28 17:02:57.478099-07	\N	t	beginner
lab-12-11	2d0387d8-8ce1-46ce-b39a-4c22e10fda93	LAB: Arithmetic Expressions	Write a MIPS program to implement a multi-term arithmetic expression across saved registers without simplification.	Given the mapping of registers to variables below, write a program to implement the following expression:\n\n  y = ((x1 + x3) - (x5 - x7)) + ((x4 - x2 + x6) + (x5 - x1))\n\nRegister Mapping:\n  $s0 = y\n  $s1 = x1\n  $s2 = x2\n  $s3 = x3\n  $s4 = x4\n  $s5 = x5\n  $s6 = x6\n  $s7 = x7\n\nYou may use any temporary registers from $t0 to $t9.\nClearly specify your choice of registers using comments.\n\nImportant: Do not simplify the expression.\n\nExample Test:\n  $s1=4, $s2=6, $s3=5, $s4=2, $s5=-3, $s6=-1, $s7=0\n\nExpected Result:\n  $s0 = 0\n  (All other registers unchanged)	# LAB 12.11 - Arithmetic Expressions\n# y = ((x1 + x3) - (x5 - x7)) + ((x4 - x2 + x6) + (x5 - x1))\n#\n# Register Mapping:\n#   $s0=y, $s1=x1, $s2=x2, $s3=x3\n#   $s4=x4, $s5=x5, $s6=x6, $s7=x7\n#\n# You may use $t0-$t9 as temporaries. Comment your choices.\n# Do NOT simplify the expression.\n\n# Write your code below\n	\N	{"$s0": "y", "$s1": "x1", "$s2": "x2", "$s3": "x3", "$s4": "x4", "$s5": "x5", "$s6": "x6", "$s7": "x7"}	{"$s1": 4, "$s2": 6, "$s3": 5, "$s4": 2, "$s5": -3, "$s6": -1, "$s7": 0}	64	30	1000	100	2026-02-28 17:02:57.478099-07	\N	t	beginner
lab-12-12	2d0387d8-8ce1-46ce-b39a-4c22e10fda93	Zylab 1 - ALU and Data Transfer Instructions	Write a MIPS program to perform ALU operations (multiply, divide, mod, shifts, bitwise logic) on an integer array and store results back to memory.	Given an array of 2 integers, write a MIPS program to implement ALU operations and store results back to memory.\n\nRegister Mapping:\n  $s0 = A (base address of array)\n\nArray Layout:\n  $s0+0  = A[0]\n  $s0+4  = A[1]\n  $s0+8  = A[2]  ... and so on\n\nOperations to implement (C pseudocode):\n\n  // Declaration of variables\n  int* A;       // Integer array A, base address in $s0\n  int a;\n  char b, c;\n  short d;\n\n  { A[2], A[4] } = A[1] * A[0];         // 64-bit product: hi -> A[2], lo -> A[4]\n  A[5] = A[4] / 230;\n  a = A[4] % 230;\n  b = a >> 16;                           // right shift\n  c = (a & 0b1000) | (b | 0b0011);      // bitwise AND/OR\n  d = a << 2;                            // left shift\n  A[6] = {b, c, d};                     // concatenation via memory ops\n  A[3] = (A[0] + A[1] - 100) - (A[2] + A[4] - A[5]);\n\nYou may use $t0-$t9 or $s1-$s7. Comment your register choices.\n\nExample Test:\n  $s0 = 8016\n  Memory[8016] = -5  (A[0])\n  Memory[8020] =  8  (A[1])\n\nExpected Results:\n  A[2] = 78\n  A[3] = -64\n  A[4] = 8032 (address)\n  A[5] = -4\n  A[6] = 8036 (address)\n  A[7] = -160	# LAB 12.12 - Zylab 1: ALU and Data Transfer Instructions\n# $s0 = base address of array A\n# A[0] at $s0+0, A[1] at $s0+4, A[2] at $s0+8, ...\n#\n# You may use $t0-$t9 or $s1-$s7. Comment your register choices.\n\n# Write your code below\n	\N	{"$s0": "A (base address)"}	{"$s0": 4000}	64	30	2000	100	2026-02-28 17:02:57.478099-07	\N	t	intermediate
lab-12-13	2d0387d8-8ce1-46ce-b39a-4c22e10fda93	Zylab 2 - Loops (Conditional and Unconditional Branch Instructions)	Write a MIPS program to remove all duplicate elements from an array in-place, leaving only unique integers, and update the array size.	Given an array (base address and number of elements), write a MIPS program to:\n  - Delete all duplicate elements\n  - Ensure the final array contains unique integers only\n  - Update the size of the array after deleting duplicates\n\nRegister Mapping:\n  $s0 = Array (base address)\n  $s1 = size\n\nArray Layout:\n  $s0+0       = Array[0]\n  $s0+4       = Array[1]\n  ...\n  $s0+4*(n-1) = Array[n-1]\n\nYou may use $t0-$t9 or $s2-$s7. Comment your register choices.\n\nReference C code (you may use a different algorithm but must comment it):\n\n  i = 0;\n  while (i < size) {\n      j = i + 1;\n      while (j < size) {\n          if (Array[i] == Array[j]) {\n              for (k = j; k < size-1; k++)\n                  Array[k] = Array[k+1];\n              size = size - 1;\n          } else\n              j++;\n      }\n      i++;\n  }\n\nExample Test:\n  $s0 = 4000, $s1 = 10\n\n  Initial Array (address -> value):\n    4000 ->  4\n    4004 ->  4\n    4008 -> -1\n    4012 ->  3\n    4016 -> -1\n    4020 -> -1\n    4024 ->  0\n    4028 ->  4\n    4032 ->  4\n    4036 ->  0\n\nExpected Results:\n  $s1 = 4\n\n  Final Array:\n    4000 ->  4\n    4004 ->  4  (note: based on provided example output)\n    4008 -> -1\n    4012 ->  3	# LAB 12.13 - Zylab 2: Loops (Remove Duplicates)\n# $s0 = base address of Array\n# $s1 = size of array\n#\n# You may use $t0-$t9 or $s2-$s7. Comment your register choices.\n# Write your algorithm as a comment before the MIPS code.\n\n# Write your code below\n	\N	{"$s0": "Array (base address)", "$s1": "size"}	{"$s0": 4000, "$s1": 10}	64	60	5000	100	2026-02-28 17:02:57.478099-07	\N	t	intermediate
lab-12-14	2d0387d8-8ce1-46ce-b39a-4c22e10fda93	Zylab 3 - Single Procedure Call	Write a MIPS program using two independently called functions (power and newElement) from main to build a new array where P[i] = A[i]^i.	Given an array of at least one integer, write a program to create a new array where P[i] = A[i]^i.\n\nWrite two functions called independently from main:\n\n1. power(a, b)\n   - Inputs: element a = A[i], exponent b = i\n   - Task: returns a^b\n\n2. newElement(*P, k, pow)\n   - Inputs: base address of P, current size k, new element pow\n   - Task: stores pow at P[k] (void, no return value)\n\nRegister Mapping:\n  $s0 = A (base address)\n  $s1 = n (length of A)\n  $s2 = P (base address of new array)\n  $s3 = k (current length of P)\n\nArray Layout:\n  $s0+0       = A[0]\n  $s0+4       = A[1]\n  ...\n  $s0+4*(n-1) = A[n-1]\n\nReference C code:\n\n  int main() {\n      P[0] = 1;   // A[0]^0 = 1\n      for (int j = 1; j < n; j++) {\n          k = j;\n          pow = power(A[j], j);\n          newElement(P, k, pow);\n      }\n      k++;\n  }\n\n  int power(int a, int b) {\n      int pow = a;\n      for (int l = 1; l < b; l++)\n          pow = pow * a;\n      return pow;\n  }\n\n  void newElement(int* P, int k, int pow) {\n      P[k] = pow;\n  }\n\nExample Test:\n  $s0=4000, $s1=5, $s2=8000, $s3=0\n\n  Initial Array A (address -> value):\n    4000 -> 10\n    4004 ->  4\n    4008 ->  5\n    4012 -> -5\n    4016 -> -2\n\nExpected Results:\n  $s2 = 8000\n  $s3 = 5\n\n  Array P (address -> value):\n    8000 ->   1   (10^0)\n    8004 ->   4   (4^1)\n    8008 ->  25   (5^2)\n    8012 -> -125  ((-5)^3)\n    8016 ->  -8   ((-2)^4... note: (-2)^4 = 16, check lab for exact expected)	# LAB 12.14 - Zylab 3: Single Procedure Call\n# $s0 = base address of A\n# $s1 = n (length of A)\n# $s2 = base address of P\n# $s3 = k (current size of P)\n#\n# Write main, power, and newElement functions below\n	\N	{"$s0": "A (base address)", "$s1": "n", "$s2": "P (base address)", "$s3": "k"}	{"$s0": 4000, "$s1": 5, "$s2": 8000, "$s3": 0}	64	60	5000	100	2026-02-28 17:02:57.478099-07	\N	t	intermediate
lab-12-15	2d0387d8-8ce1-46ce-b39a-4c22e10fda93	Zylab 4 - Nested Procedure Call	Write a MIPS program to insert a given node into a linked list at a specified location using nested procedure calls. Incorrect procedure execution results in zero points.	Write a MIPS program to add a given node in a linked list at the specified location using Nested Procedure Calls.\nNote: If your code runs perfectly but procedure execution is not used correctly, you will receive zero points.\n\nGiven Inputs:\n  - $s0 = head: address of the first node of the linked list\n  - $s1 = newNode: address of the node to be inserted\n  - $s2 = n: number of the node after which to insert (0 = before first node)\n\nEach node contains:\n  - node_addr+0: integer value\n  - node_addr+4: address of next node (0 if last node)\n\nWrite the following three functions:\n\n1. main\n   - Calls addNode(head, n, newNode)\n   - Reads the value of the newly added node into $s3\n\n2. addNode(head, n, newNode)\n   - If n == 0 or head == 0: insert at beginning\n       newNode->next = head\n       head = newNode\n   - Otherwise: calls findNode(head, n) to get addr1 (nth node) and addr2 ((n+1)th node)\n       addr1->next = newNode\n       newNode->next = addr2\n   - Returns: value of inserted node\n   - If n > list size, insert at end\n\n3. findNode(head, n)\n   - Traverses the list to find the nth node\n   - Returns: address of nth node AND address of (n+1)th node\n\nC Reference:\n\n  int addNode(node* head, int n, node* newNode) {\n      node *addr1, *addr2;\n      if (n == 0 || head == 0) {\n          newNode->next = head;\n          head = newNode;\n          return(newNode->value);\n      }\n      [addr1, addr2] = findNode(head, n);\n      addr1->next = newNode;\n      newNode->next = addr2;\n      return(newNode->value);\n  }\n\n  node* findNode(node* head, int n) {\n      node* curr = head;\n      for (int i = 1; i < n; i++) {\n          curr = curr->next;\n          if (curr == 0) break;\n          if (curr->next == 0) break;\n      }\n      return([curr, curr->next]);\n  }\n\nRegister Mapping:\n  $s0 = head\n  $s1 = newNode\n  $s2 = n\n  $s3 = val (value of inserted node, set by main)\n\nExample Test:\n  $s0=4000, $s1=8000, $s2=2, $s3=0\n\n  Initial Memory (address -> value):\n    8000 -> 230   (newNode->value)\n    4000 ->   4   (node1->value)\n    4004 -> 3848  (node1->next)\n    3848 -> -15   (node2->value)\n    3852 -> 6104  (node2->next)\n    6104 -> -10   (node3->value)\n    6108 -> 5008  (node3->next)\n    5008 ->   0   (node4->value)\n    5012 -> 4500  (node4->next)\n    4500 ->  40   (node5->value)\n    4504 ->   0   (node5->next = NULL)\n\nExpected Results:\n  $s3 = 230\n\n  Updated Memory:\n    8000 -> 230\n    8004 -> 6104  (newNode->next = former node3)\n    3852 -> 8000  (node2->next = newNode)\n    (all other memory unchanged)	# LAB 12.15 - Zylab 4: Nested Procedure Call (Linked List Insert)\n# $s0 = head (address of first node)\n# $s1 = newNode (address of node to insert)\n# $s2 = n (insert after nth node; 0 = insert before first)\n# $s3 = val (value of inserted node, written by main)\n#\n# Node layout:\n#   node_addr+0 = value\n#   node_addr+4 = next pointer (0 if last node)\n#\n# Write main, addNode, and findNode below\n	\N	{"$s0": "head", "$s1": "newNode", "$s2": "n", "$s3": "val"}	{"$s0": 4000, "$s1": 8000, "$s2": 2, "$s3": 0}	64	60	5000	100	2026-02-28 17:02:57.478099-07	\N	t	advanced
lab-12-16	2d0387d8-8ce1-46ce-b39a-4c22e10fda93	Zylab 5 - Recursive Procedure Call	Write a MIPS program using recursive procedure execution to compute a * F(|a+b|, |a-b|) - b * F(|b-a|, |b+a|) where F is a recursive function defined by four cases. Incorrect procedure execution results in zero points.	Write a MIPS program using Recursive Procedure Execution to perform the following tasks.\nNote: If your code runs perfectly but procedure execution is not used correctly, you will receive zero points.\n\nWrite the following functions:\n\n1. main\n   - Inputs: integers a ($s0), b ($s1)\n   - Task: compute result = a * F(|a+b|, |a-b|) - b * F(|b-a|, |b+a|)\n   - Store result in $s2\n\n2. recursion F(x, y)\n   - Inputs: integers x, y\n   - Task:\n       F(x, y) = F(x-1, y) + F(x, y-1)   if x > 0 and y > 0\n       F(x, y) = y                          if x <= 0 and y > 0\n       F(x, y) = x                          if y <= 0 and x > 0\n       F(x, y) = 0                          if x <= 0 and y <= 0\n\nC Reference:\n\n  int main(int a, int b) {\n      int result = a * recursion(abs(a+b), abs(a-b))\n                     - b * recursion(abs(b-a), abs(b+a));\n  }\n\n  int recursion(int x, int y) {\n      if (x <= 0 && y <= 0)       return 0;\n      else if (x > 0 && y <= 0)  return x;\n      else if (x <= 0 && y > 0)  return y;\n      else return recursion(x-1, y) + recursion(x, y-1);\n  }\n\nRegister Mapping:\n  $s0 = a\n  $s1 = b\n  $s2 = result\n\nExample Test:\n  $s0=1, $s1=2, $s2=0\n\nExpected Result:\n  $s0 = 1\n  $s1 = 2\n  $s2 = -7	# LAB 12.16 - Zylab 5: Recursive Procedure Call\n# $s0 = a\n# $s1 = b\n# $s2 = result\n#\n# F(x,y) = F(x-1,y) + F(x,y-1)   if x > 0 and y > 0\n#        = y                        if x <= 0 and y > 0\n#        = x                        if y <= 0 and x > 0\n#        = 0                        if x <= 0 and y <= 0\n#\n# Write main and recursion below\n	\N	{"$s0": "a", "$s1": "b", "$s2": "result"}	{"$s0": 1, "$s1": 2, "$s2": 0}	64	60	50000	100	2026-02-28 17:02:57.478099-07	\N	t	advanced
lab-12-17	2d0387d8-8ce1-46ce-b39a-4c22e10fda93	ZyLab 6 - MIPS Recursive Multiplication	Write a MIPS program to compute the product of two 16-bit signed numbers using the shift-and-add recursive algorithm. The mult and mul instructions are NOT allowed. Failing to use procedure execution yields at most half credit.	Write a MIPS program to compute the product of two 16-bit signed numbers using recursive procedure calls.\nNote: You CANNOT use the mult or mul instructions.\nNote: If tests pass but procedure execution is not used, you receive at most half points (2 points).\n\nWrite the following functions:\n\n1. main\n   - Inputs: multiplicand md ($s1), multiplier m ($s2)\n   - Initialize product $s0 = 0\n   - Handle sign: if exactly one operand is negative, set sign_p = 1\n   - Do NOT modify $s1 or $s2; use local argument registers\n   - Convert negative operands to positive before calling recursion\n   - Call recursion(0, |md|, |m|, 16)\n   - If sign_p == 1, negate the result\n   - Store final product in $s0\n\n2. recursion(p, md, m, n)\n   - Inputs: product p, multiplicand md, multiplier m, iteration count n\n   - Base case: if n == 0, return p\n   - Otherwise:\n       m_0 = m & 1         (LSB of multiplier)\n       if m_0 == 1: p = p + md\n       m  = m  >> 1\n       md = md << 1\n       return recursion(p, md, m, n-1)\n\nC Reference:\n\n  int main(int m, int md) {\n      int sign_p = 0;\n      if ((m < 0 && md > 0) || (m > 0 && md < 0)) sign_p = 1;\n      int arg_m  = (m  < 0) ? -m  : m;\n      int arg_md = (md < 0) ? -md : md;\n      int p = recursion(0, arg_md, arg_m, 16);\n      if (sign_p == 1) p = -p;\n  }\n\n  int recursion(int p, int md, int m, int n) {\n      if (n == 0) return p;\n      int m_0 = m & 1;\n      if (m_0 == 1) p = p + md;\n      m  = m  >> 1;\n      md = md << 1;\n      return recursion(p, md, m, n-1);\n  }\n\nRegister Mapping:\n  $s0 = product (p)\n  $s1 = multiplicand (md)\n  $s2 = multiplier (m)\n\nExample Test:\n  $s0=0, $s1=8000, $s2=15000\n\nExpected Result:\n  $s0 = 120000000\n  $s1 = 8000\n  $s2 = 15000	# LAB 12.17 - ZyLab 6: MIPS Recursive Multiplication\n# $s0 = product (p)\n# $s1 = multiplicand (md)\n# $s2 = multiplier (m)\n#\n# NO mult or mul instructions allowed.\n# Use shift-and-add algorithm with recursive calls (16 iterations).\n#\n# Write main and recursion below\n	\N	{"$s0": "product", "$s1": "multiplicand", "$s2": "multiplier"}	{"$s0": 0, "$s1": 8000, "$s2": 15000}	64	60	50000	100	2026-02-28 17:02:57.478099-07	\N	t	advanced
lab-12-18	2d0387d8-8ce1-46ce-b39a-4c22e10fda93	Zylab 7 - MIPS Procedure Execution	Write a MIPS program using procedure execution to build array B where B[i] = sum of the first i+1 elements of array A, via a helper function nSum called from main. Score is 0 if procedures are not used.	Given an array A of at least one integer, write a MIPS program to create array B where B[i] = sum of the first i elements of A (i.e., A[0] through A[i]).\n\nNote: If procedure execution or functions are not used, you will receive a score of 0 even if tests pass.\n\nWrite the following functions:\n\n1. main\n   - Variables: base address of A ($s0), base address of B ($s1), length n ($s2)\n   - For each index j from 0 to n-1:\n       B[j] = nSum(A, j)\n\n2. nSum(*A, k)\n   - Inputs: base address of array A, index k\n   - Task: compute sum of A[0] + A[1] + ... + A[k]\n   - Note: if A elements are overwritten during execution, use the updated values\n   - Return: sum\n\nC Reference:\n\n  int main() {\n      for (int j = 0; j < n; j++) {\n          B[j] = nSum(A, j);\n      }\n  }\n\n  int nSum(int* A, int k) {\n      int sum = A[0];\n      for (int j = 1; j <= k; j++)\n          sum = sum + A[j];\n      return sum;\n  }\n\nRegister Mapping:\n  $s0 = A (base address)\n  $s1 = B (base address)\n  $s2 = n (length of both arrays)\n\nArray Layout:\n  $s0+0       = A[0]\n  $s0+4       = A[1]\n  ...\n  $s0+4*(n-1) = A[n-1]\n\nExample Test:\n  $s0=4000, $s1=8000, $s2=5\n\n  Initial Array A (address -> value):\n    4000 -> 10\n    4004 ->  4\n    4008 -> -5  (note: lab shows A[2]=-5 based on nSum results)\n    4012 -> -2\n    4016 ->  0\n\nExpected Array B (address -> value):\n  8000 -> 10   (A[0])\n  8004 -> 15   (A[0]+A[1])\n  8008 -> 10   (A[0]+A[1]+A[2])\n  8012 ->  8   (A[0]+A[1]+A[2]+A[3])\n  8016 ->  8   (A[0]+A[1]+A[2]+A[3]+A[4])	# LAB 12.18 - Zylab 7: MIPS Procedure Execution\n# $s0 = A (base address)\n# $s1 = B (base address)\n# $s2 = n (number of elements)\n#\n# B[j] = nSum(A, j) = A[0] + A[1] + ... + A[j]\n#\n# Write main and nSum below\n	\N	{"$s0": "A (base address)", "$s1": "B (base address)", "$s2": "n"}	{"$s0": 4000, "$s1": 8000, "$s2": 5}	64	60	10000	100	2026-02-28 17:02:57.478099-07	\N	t	advanced
lab-1-0	2d0387d8-8ce1-46ce-b39a-4c22e10fda93	Tutorial: Using the MIPS Emulator	An introductory tutorial to familiarize students with the MIPS Emulator interface, controls, breakpoints, and supported instruction set.	Welcome to the MIPS Emulator!\n\nThis environment is designed to help you write, debug, and test MIPS assembly code. Before starting the assignments, please familiarize yourself with the interface controls below.\n\n1. THE INTERFACE CONTROLS\n\n  Run:  Assembles the code and executes it until completion or error.\n  Step: Executes the code one line at a time. Useful for debugging to see how registers change.\n  Stop: Resets the emulator, clears registers, and wipes memory.\n\n  Registers Panel: Shows the current state of the CPU.\n    Tip: You can click inside the value box of a register to manually edit it between steps!\n\n  Memory Panel: Shows the hex and ASCII representation of memory.\n    Use the "Address" input and "Go" button to jump to specific regions (default is 0x10000000).\n\n2. USING BREAKPOINTS\n\n  You can pause execution at a specific line without stepping through the whole program manually:\n    1. Click the gutter (the space to the left of the line numbers) in the code editor.\n    2. A red dot will appear.\n    3. Press Run. The program will execute at full speed and pause automatically when it hits that line.\n\n3. SUPPORTED INSTRUCTION SET\n\n  Arithmetic:        add, addu, sub, subu, addi, addiu, mult, multu, div, divu\n  Logical:           and, andi, or, ori, xor, xori, nor\n  Data Transfer:     lw, sw, lb, sb, lh, sh, lui, mfhi, mflo\n  Branch & Jump:     beq, bne, j, jal, jr\n  Comparison (Set):  slt, slti, sltiu, sltu\n  Shifting:          sll, srl, sra\n  Pseudo-Instr:      li, la, move, blt, bgt, ble, bge\n\n4. TUTORIAL EXERCISE\n\n  Follow these steps:\n    1. Review the code in the Assembler panel.\n    2. Click the Step button repeatedly to watch $t0, $t1, and $t2 change.\n    3. Observe the Memory panel. After the sw instruction executes,\n       the value 30 (hex 1E) will appear at address 0x10000000.\n    4. Check the Test Cases below to see if your execution matches the requirements.	# Tutorial Starter Code\n# Initialize Registers\nli $t0, 10      # Load immediate 10 into $t0\nli $t1, 20      # Load immediate 20 into $t1\n\n# Arithmetic Operation\nadd $t2, $t0, $t1  # $t2 = 10 + 20 = 30\n\n# Memory Operation\nli $s0, 0x10000000 # Load base address\nsw $t2, 0($s0)     # Store 30 into memory at 0x10000000\n\n# End\n# (The emulator stops automatically when instructions run out)\n	# Tutorial Starter Code\n# Initialize Registers\nli $t0, 10      # Load immediate 10 into $t0\nli $t1, 20      # Load immediate 20 into $t1\n\n# Arithmetic Operation\nadd $t2, $t0, $t1  # $t2 = 10 + 20 = 30\n\n# Memory Operation\nli $s0, 0x10000000 # Load base address\nsw $t2, 0($s0)     # Store 30 into memory at 0x10000000\n\n# End\n# (The emulator stops automatically when instructions run out)\n	{"$s0": "memory base address", "$t0": "first operand", "$t1": "second operand", "$t2": "result"}	{"$s0": 268435456, "$t0": 10, "$t1": 20, "$t2": 0}	64	30	100	0	2026-02-28 17:04:37.440726-07	\N	t	beginner
\.


--
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_preferences (preference_id, user_id, theme, editor_font_size, auto_save_enabled, additional_preferences) FROM stdin;
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (session_id, user_id, session_token, expires_at, ip_address, user_agent) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, username, email, password_hash, role, created_at, last_login, is_active, full_name, asu_id) FROM stdin;
870155eb-20ec-484f-a5fc-08d35a226e1b	mkeisenb	mkeisenb@asu.edu	scrypt:32768:8:1$qerf7P1VuDyI9nO7$1bc29e977d520b41a778cdcbc6fc1c0b01d4362153acf98f262f4fbde72bbcb3220ea73121b2fd31ff3a708ed0d57509465e116ea2db5779ccba6e805d75137e	student	2026-02-28 16:42:48.921311-07	\N	t	Matthew Eisenberg	1229111899
\.


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (course_id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (enrollment_id);


--
-- Name: lab_test_cases lab_test_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_test_cases
    ADD CONSTRAINT lab_test_cases_pkey PRIMARY KEY (test_case_id);


--
-- Name: labs labs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labs
    ADD CONSTRAINT labs_pkey PRIMARY KEY (lab_id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (preference_id);


--
-- Name: user_preferences user_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: user_sessions user_sessions_session_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_session_token_key UNIQUE (session_token);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: enrollments enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- Name: enrollments enrollments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: lab_test_cases lab_test_cases_lab_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_test_cases
    ADD CONSTRAINT lab_test_cases_lab_id_fkey FOREIGN KEY (lab_id) REFERENCES public.labs(lab_id) ON DELETE CASCADE;


--
-- Name: labs labs_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labs
    ADD CONSTRAINT labs_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict KmCGiyOnhdshy4aAV31YJBFCvEs6q6d1lrQcJNJaheB3yjkCJ23n10D9QwZvdNj

