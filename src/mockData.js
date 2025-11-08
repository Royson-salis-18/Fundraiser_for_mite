export const students = [
  {
    usn: "1MS21CS001",
    role: "student",
    name: "Student One",
    dob: "01012003", // DDMMYYYY
    password: "01012003",
    email: "student1@mite.ac.in",
    payments: {
      mandatory: [
        { id: 1, paid: true },
      ],
      optional: [
        { id: 101, paid: true },
      ],
    },
  },
  {
    usn: "4mt23ai046",
    role: "student",
    name: "Student Two",
    dob: "02022004", // DDMMYYYY
    password: "02022004",
    email: "student2@mite.ac.in",
    payments: {
      mandatory: [],
      optional: [],
    },
  },
];

export const admins = [
  {
    usn: "admin",
    role: "admin",
    dob: "01011990", // DDMMYYYY
    password: "01011990",
  },
];

export const payments = [
  {
    id: 1,
    type: "mandatory",
    title: "Semester Tuition Fees",
    description: "Mandatory tuition fees for the current semester",
    amount: 45000,
    payeeName: "MITE College Accounts",
    payeeUpiId: "mite.college@upi",
    targetClass: "All Classes",
    targetStudents: "All Students",
    poster: "https://images.unsplash.com/photo-1543286386-713bdd548da4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
  },
  {
    id: 101,
    type: "optional",
    title: "Sentia - Annual Day",
    description: "The annual flagship event celebrating MITE's achievements and talents",
    amount: 500,
    payeeName: "Cultural Committee",
    payeeUpiId: "mite.sentia@upi",
    targetClass: "All Classes",
    targetStudents: "All Students",
    poster: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80",
  },
  {
    id: 102,
    type: "optional",
    title: "Kampana - Kannada Rajyotsava",
    description: "A celebration of Karnataka's culture and heritage",
    amount: 300,
    payeeName: "Kannada Sangha",
    payeeUpiId: "kampana@upi",
    targetClass: "All Classes",
    targetStudents: "All Students",
    poster: "https://images.unsplash.com/photo-1610116306294-3f53468c5a5c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80",
  },
  {
    id: 103,
    type: "optional",
    title: "Andhas - Onam",
    description: "Traditional Onam celebration with pookalam and sadhya",
    amount: 250,
    payeeName: "Malayali Association",
    payeeUpiId: "andhas@upi",
    targetClass: "All Classes",
    targetStudents: "All Students",
    poster: "https://images.unsplash.com/photo-1604118100489-5b0a6eee6a3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
  },
  {
    id: 104,
    type: "optional",
    title: "Cerebro - Tech Fest",
    description: "A platform for students to showcase their technical skills",
    amount: 400,
    payeeName: "Tech Club",
    payeeUpiId: "cerebro@upi",
    targetClass: "All Classes",
    targetStudents: "All Students",
    poster: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2020&q=80",
  },
  {
    id: 105,
    type: "optional",
    title: "Sports Day",
    description: "Annual sports meet with various athletic events",
    amount: 200,
    payeeName: "Sports Committee",
    payeeUpiId: "sportsday@upi",
    targetClass: "All Classes",
    targetStudents: "All Students",
    poster: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80",
  },
];