/**
 * Seed realistic demo data across users, appointments, and emergencies.
 * All demo records are tagged with isDemo: true for clean isolation and removal.
 * Usage: npm run seed:demo
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/campus-health";

// Schemas
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  phone: String,
  regNo: { type: String, unique: true, sparse: true },
  department: String,
  year: Number,
  gender: String,
  bloodGroup: String,
  staffId: { type: String, unique: true, sparse: true },
  medicalDepartment: String,
  designation: String,
  qualification: String,
  dutyStatus: { type: String, default: "available" },
  isDemo: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const AvailabilitySchema = new mongoose.Schema({
  staff: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date: String,
  startTime: String,
  endTime: String,
  isBooked: { type: Boolean, default: false },
  isDemo: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const Availability = mongoose.models.Availability || mongoose.model("Availability", AvailabilitySchema);

const AppointmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  availability: { type: mongoose.Schema.Types.ObjectId, ref: "Availability" },
  date: String,
  startTime: String,
  endTime: String,
  reason: String,
  type: String,
  department: String,
  service: String,
  status: String,
  visitNotes: String,
  completedAt: Date,
  isDemo: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);

const EmergencySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: String,
  description: String,
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    manualLocation: String,
  },
  status: String,
  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  respondedAt: Date,
  resolvedAt: Date,
  responseTimeSeconds: Number,
  isDemo: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const Emergency = mongoose.models.Emergency || mongoose.model("Emergency", EmergencySchema);

const ReportSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },
  category: String,
  title: String,
  summary: String,
  condition: { type: String, default: "normal" },
  reportDate: String,
  hasFile: { type: Boolean, default: false },
  viewedByStudentAt: { type: Date, default: null },
  isDemo: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const Report = mongoose.models.Report || mongoose.model("Report", ReportSchema);

const AccessLogSchema = new mongoose.Schema({
  staff: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: String,
  report: { type: mongoose.Schema.Types.ObjectId, ref: "Report", default: null },
  isDemo: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const AccessLog = mongoose.models.AccessLog || mongoose.model("AccessLog", AccessLogSchema);

const ReviewSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, unique: true },
  rating: { type: Number, required: true },
  comment: { type: String, default: "" },
  isAnonymous: { type: Boolean, default: false },
  isDemo: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const Review = mongoose.models.Review || mongoose.model("Review", ReviewSchema);

const AmbulanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  vehicleNumber: { type: String, unique: true },
  type: String,
  driverName: String,
  driverPhone: String,
  status: { type: String, default: "offline" },
  location: {
    latitude: Number,
    longitude: Number,
    updatedAt: Date,
  },
  isDemo: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const Ambulance = mongoose.models.Ambulance || mongoose.model("Ambulance", AmbulanceSchema);

const ReferralSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fromDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  toDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },
  emergency: { type: mongoose.Schema.Types.ObjectId, ref: "Emergency", default: null },
  type: { type: String, enum: ["single", "emergency-leave"], default: "single" },
  batchId: { type: String, default: null },
  urgency: { type: String, enum: ["routine", "urgent", "emergency"], default: "routine" },
  reason: { type: String, required: true },
  note: { type: String, default: "" },
  status: { type: String, enum: ["pending", "accepted", "declined", "cancelled"], default: "pending" },
  respondedAt: { type: Date, default: null },
  responseNote: { type: String, default: "" },
  isDemo: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const Referral = mongoose.models.Referral || mongoose.model("Referral", ReferralSchema);

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: [
      "referral-request",
      "referral-accepted",
      "referral-declined",
      "appointment-update",
      "appointment-transferred",
      "report-ready",
      "ambulance-update",
      "general",
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: "" },
  isRead: { type: Boolean, default: false },
  isDemo: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

// Sample Data Profiles
const DEMO_STUDENTS = [
  { name: "Alex Chen", email: "student1@demo.edu", phone: "9876543210", regNo: "STU2023001", department: "CSE", year: 3, gender: "Male", bloodGroup: "O+" },
  { name: "Emily Watson", email: "student2@demo.edu", phone: "9876543211", regNo: "STU2023002", department: "ECE", year: 2, gender: "Female", bloodGroup: "A+" },
  { name: "David Kim", email: "student3@demo.edu", phone: "9876543212", regNo: "STU2023003", department: "ME", year: 4, gender: "Male", bloodGroup: "B+" },
  { name: "Sophia Martinez", email: "student4@demo.edu", phone: "9876543213", regNo: "STU2023004", department: "Civil", year: 1, gender: "Female", bloodGroup: "AB+" },
  { name: "Liam Johnson", email: "student5@demo.edu", phone: "9876543214", regNo: "STU2023005", department: "MBA", year: 2, gender: "Male", bloodGroup: "O-" },
  { name: "Olivia Taylor", email: "student6@demo.edu", phone: "9876543215", regNo: "STU2023006", department: "CSE", year: 3, gender: "Female", bloodGroup: "A-" },
  { name: "Noah Patel", email: "student7@demo.edu", phone: "9876543216", regNo: "STU2023007", department: "ECE", year: 2, gender: "Male", bloodGroup: "B-" },
  { name: "Ava Robinson", email: "student8@demo.edu", phone: "9876543217", regNo: "STU2023008", department: "Other", year: 1, gender: "Female", bloodGroup: "O+" },
];

const DEMO_STAFF = [
  {
    name: "Dr. Sarah Jenkins, MD",
    email: "staff1@demo.edu",
    phone: "9876543220",
    staffId: "DOC-0001",
    medicalDepartment: "General Medicine",
    designation: "Chief Medical Officer",
    qualification: "MD, MBBS",
    dutyStatus: "available",
  },
  {
    name: "Dr. Marcus Vance, DO",
    email: "staff2@demo.edu",
    phone: "9876543221",
    staffId: "DOC-0002",
    medicalDepartment: "Counseling",
    designation: "Psychiatrist & Counselor",
    qualification: "DO, M.Sc Psychiatry",
    dutyStatus: "available",
  },
  {
    name: "Nurse Priya Sharma, NP",
    email: "staff3@demo.edu",
    phone: "9876543222",
    staffId: "DOC-0003",
    medicalDepartment: "Emergency",
    designation: "Senior Triage Nurse",
    qualification: "B.Sc Nursing, NP",
    dutyStatus: "available",
  },
  {
    name: "Dr. Anita Desai, MD",
    email: "staff4@demo.edu",
    phone: "9876543223",
    staffId: "DOC-0004",
    medicalDepartment: "Dermatology (Skin)",
    designation: "Consultant Dermatologist",
    qualification: "MD Dermatology",
    dutyStatus: "available",
  },
  {
    name: "Dr. Rajesh Gupta, MD",
    email: "staff5@demo.edu",
    phone: "9876543224",
    staffId: "DOC-0005",
    medicalDepartment: "Pathology Lab",
    designation: "Senior Pathologist & Lab Director",
    qualification: "MD Pathology",
    dutyStatus: "available",
  },
  {
    name: "Dr. Kevin Miller, DDS",
    email: "staff6@demo.edu",
    phone: "9876543225",
    staffId: "DOC-0006",
    medicalDepartment: "Dental",
    designation: "Dental Surgeon",
    qualification: "DDS, BDS",
    dutyStatus: "available",
  },
];

const REASONS_AND_NOTES = [
  {
    type: "general",
    reason: "Severe migraine, light sensitivity, and nausea for 3 days",
    notes: "Patient examined. Neurological check normal. Prescribed sumatriptan and antiemetic. Advised dark room rest and adequate fluid intake. Follow-up in 10 days if headaches persist.",
  },
  {
    type: "injury",
    reason: "Right ankle twisted during intramural basketball match",
    notes: "Mild edema over lateral malleolus. Ottawa ankle rules negative. RICE protocol and elastic bandage applied. Prescribed ibuprofen 400mg TID prn. Crutches issued for 48 hours.",
  },
  {
    type: "counseling",
    reason: "Acute exam anxiety, palpitations, and sleep disruption",
    notes: "Discussed cognitive reframing strategies and progressive muscle relaxation. Recommended sleep hygiene routine. Provided referral for weekly counseling center sessions.",
  },
  {
    type: "general",
    reason: "Fever 101.4F, productive cough, and body aches",
    notes: "Chest clear bilaterally on auscultation. Rapid strep and COVID tests negative. Viral upper respiratory infection diagnosed. Recommended acetaminophen, fluids, and rest.",
  },
  {
    type: "emergency-followup",
    reason: "Follow-up check after ER visit for food allergic reaction",
    notes: "Urticaria fully resolved. Reviewed self-administration of EpiPen injector. Discussed food allergen avoidance with student dining supervisor.",
  },
  {
    type: "counseling",
    reason: "Burnout symptoms and chronic difficulty concentrating",
    notes: "Administered PHQ-9 and GAD-7 screens. Provided university academic accommodation advisory letter. Weekly follow-up scheduled.",
  },
  {
    type: "general",
    reason: "Asthma inhaler prescription renewal and peak flow check",
    notes: "Peak expiratory flow rate 480 L/min (92% of personal best). Refilled albuterol HFA and budesonide inhalers. Asthma action plan updated.",
  },
];

const EMERGENCY_INCIDENTS = [
  {
    type: "medical",
    description: "Student lost consciousness momentarily in Science Complex Hall 2",
    locationName: "Science Complex - Hall 2",
    latOffset: 0.0021,
    lngOffset: -0.0018,
  },
  {
    type: "injury",
    description: "Deep hand cut from broken laboratory glassware with active bleeding",
    locationName: "Chemistry Building - Lab 304",
    latOffset: 0.0035,
    lngOffset: 0.0022,
  },
  {
    type: "mental-health",
    description: "Acute hyperventilation, dizziness, and intense panic symptoms",
    locationName: "North Dormitory Quad - Block C",
    latOffset: -0.0028,
    lngOffset: -0.0031,
  },
  {
    type: "medical",
    description: "Suspected severe anaphylactic reaction after lunch; facial swelling",
    locationName: "Student Union Dining Pavilion",
    latOffset: -0.0012,
    lngOffset: 0.0019,
  },
  {
    type: "injury",
    description: "Bicycle fall near engineering bridge; severe road rash and shoulder contusion",
    locationName: "Engineering Bridge Crosswalk",
    latOffset: 0.0042,
    lngOffset: -0.0005,
  },
  {
    type: "medical",
    description: "Asthmatic student experiencing severe wheezing and unable to speak full sentences",
    locationName: "Main Library - 3rd Floor Commons",
    latOffset: 0.0008,
    lngOffset: -0.0014,
  },
  {
    type: "other",
    description: "Chemical vapor fumes in basement workshop causing respiratory distress",
    locationName: "Materials Workshop Basement",
    latOffset: 0.0019,
    lngOffset: 0.0038,
  },
  {
    type: "mental-health",
    description: "Student in severe emotional crisis and distress requesting on-duty counselor",
    locationName: "South Quad Student Dormitory",
    latOffset: -0.0039,
    lngOffset: 0.0011,
  },
  {
    type: "injury",
    description: "Weight drop on foot in Campus Recreation Gym; swelling and severe pain",
    locationName: "Varsity Athletics & Fitness Center",
    latOffset: -0.0025,
    lngOffset: -0.0042,
  },
  {
    type: "medical",
    description: "Severe abdominal pain, vomiting, and high fever in dorm room",
    locationName: "East Campus Apartments - Unit 12",
    latOffset: 0.0031,
    lngOffset: 0.0045,
  },
  {
    type: "injury",
    description: "Fall down concrete exterior stairs near humanities auditorium",
    locationName: "Humanities Auditorium Exterior",
    latOffset: -0.0005,
    lngOffset: -0.0021,
  },
  {
    type: "medical",
    description: "Epileptic seizure witnessed by classmates in lecture hall",
    locationName: "Law School Lecture Hall B",
    latOffset: 0.0015,
    lngOffset: -0.0034,
  },
  {
    type: "other",
    description: "Heat exhaustion and severe cramping during outdoor ROTC drills",
    locationName: "North Campus Athletic Fields",
    latOffset: 0.0051,
    lngOffset: -0.0019,
  },
  {
    type: "medical",
    description: "Student experiencing sudden severe chest tightness and tachycardia",
    locationName: "Graduate Research Hub",
    latOffset: -0.0019,
    lngOffset: 0.0028,
  },
  {
    type: "mental-health",
    description: "Disoriented student experiencing extreme distress and sensory overload",
    locationName: "Fine Arts Studio Building",
    latOffset: 0.0026,
    lngOffset: -0.0029,
  },
];

const BASE_CAMPUS_LAT = 37.4275;
const BASE_CAMPUS_LNG = -122.1697;

function getDbHost(uri) {
  try {
    const parsed = new URL(uri);
    return parsed.host;
  } catch {
    const withoutScheme = uri.replace(/^mongodb(\+srv)?:\/\//, "");
    const withoutAuth = withoutScheme.replace(/^.*@/, "");
    return withoutAuth.split("/")[0].split("?")[0] || "configured-host";
  }
}

async function main() {
  console.log("Connecting to MongoDB...");
  console.log(`Database host: ${getDbHost(MONGODB_URI)}`);
  await mongoose.connect(MONGODB_URI);

  const hashedPassword = await bcrypt.hash("Demo@12345", 10);

  // 1. Create or retrieve 8 demo students
  console.log("\n1. Ensuring 8 demo students exist...");
  const students = [];
  for (const s of DEMO_STUDENTS) {
    let student = await User.findOne({ email: s.email });
    if (!student) {
      student = await User.create({
        name: s.name,
        email: s.email,
        password: hashedPassword,
        role: "student",
        phone: s.phone,
        regNo: s.regNo,
        department: s.department,
        year: s.year,
        gender: s.gender,
        bloodGroup: s.bloodGroup,
        isDemo: true,
      });
      console.log(`   + Created student: ${s.name} (${s.email}, Reg: ${s.regNo})`);
    } else {
      student.regNo = s.regNo;
      student.department = s.department;
      student.year = s.year;
      student.gender = s.gender;
      student.bloodGroup = s.bloodGroup;
      student.phone = s.phone;
      await student.save();
      console.log(`   ✓ Updated student: ${s.name} (${s.email}, Reg: ${s.regNo})`);
    }
    students.push(student);
  }

  // 2. Create or retrieve 3 demo staff
  console.log("\n2. Ensuring 3 demo healthcare staff exist...");
  const staffMembers = [];
  for (const st of DEMO_STAFF) {
    let staff = await User.findOne({ email: st.email });
    if (!staff) {
      staff = await User.create({
        name: st.name,
        email: st.email,
        password: hashedPassword,
        role: "staff",
        phone: st.phone,
        staffId: st.staffId,
        medicalDepartment: st.medicalDepartment,
        designation: st.designation,
        qualification: st.qualification,
        isDemo: true,
      });
      console.log(`   + Created clinician: ${st.name} (${st.email}, ID: ${st.staffId})`);
    } else {
      staff.staffId = st.staffId;
      staff.medicalDepartment = st.medicalDepartment;
      staff.designation = st.designation;
      staff.qualification = st.qualification;
      staff.phone = st.phone;
      await staff.save();
      console.log(`   ✓ Updated clinician: ${st.name} (${st.email}, ID: ${st.staffId})`);
    }
    staffMembers.push(staff);
  }

  // 3. Create ~40 appointments across last 14 days
  console.log("\n3. Generating ~40 demo appointments over the last 14 days...");
  const timeSlots = [
    { start: "09:00", end: "09:30" },
    { start: "09:30", end: "10:00" },
    { start: "10:30", end: "11:00" },
    { start: "11:00", end: "11:30" },
    { start: "13:30", end: "14:00" },
    { start: "14:00", end: "14:30" },
    { start: "15:00", end: "15:30" },
    { start: "16:00", end: "16:30" },
  ];

  const appointmentStatuses = [
    "completed", "completed", "completed", "completed",
    "confirmed", "confirmed",
    "pending",
    "cancelled",
  ];

  let apptCount = 0;
  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const d = new Date();
    d.setDate(d.getDate() - dayOffset);
    const dateStr = d.toISOString().split("T")[0];

    // Generate 2-4 appointments per day
    const apptsToday = 2 + (dayOffset % 3);

    for (let slotIdx = 0; slotIdx < apptsToday; slotIdx++) {
      const student = students[(dayOffset * 3 + slotIdx) % students.length];
      const staff = staffMembers[(dayOffset + slotIdx) % staffMembers.length];
      const slot = timeSlots[slotIdx % timeSlots.length];
      const template = REASONS_AND_NOTES[(dayOffset + slotIdx) % REASONS_AND_NOTES.length];
      const status = dayOffset === 0
        ? (slotIdx === 0 ? "pending" : "confirmed")
        : appointmentStatuses[(dayOffset * 2 + slotIdx) % appointmentStatuses.length];

      // Create or reuse an availability slot
      let avail = await Availability.findOne({
        staff: staff._id,
        date: dateStr,
        startTime: slot.start,
      });

      if (!avail) {
        avail = await Availability.create({
          staff: staff._id,
          date: dateStr,
          startTime: slot.start,
          endTime: slot.end,
          isBooked: status !== "cancelled",
          isDemo: true,
        });
      }

      const existingAppt = await Appointment.findOne({ availability: avail._id });
      if (existingAppt) {
        continue;
      }

      const createdAt = new Date(d);
      createdAt.setHours(8 + slotIdx, 15, 0, 0);

      const isCompleted = status === "completed";
      const completedAt = isCompleted
        ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), parseInt(slot.end.split(":")[0]), 35)
        : null;

      const servicesList = {
        "General Medicine": ["Normal Checkup", "Fever", "Cold and Cough", "Typhoid", "Other Consultation"],
        "Dermatology (Skin)": ["Skin Consultation", "Allergy", "Acne and Hair", "Other"],
        "Pathology Lab": ["Blood Test", "Urine Test", "Typhoid Test", "Malaria and Dengue Test", "Other Test"],
        "Radiology (X-Ray)": ["X-Ray", "Ultrasound", "Other Scan"],
        "Counseling": ["Stress and Anxiety", "Academic Counseling", "Other"],
        "Dental": ["Dental Checkup", "Tooth Pain", "Other"],
        "ENT": ["ENT Consultation", "Other"],
        "Emergency": ["Emergency Follow-up"],
      }[staff.medicalDepartment] || ["General Consultation"];
      const chosenService = servicesList[slotIdx % servicesList.length];

      await Appointment.create({
        student: student._id,
        staff: staff._id,
        availability: avail._id,
        date: dateStr,
        startTime: slot.start,
        endTime: slot.end,
        reason: template.reason,
        type: template.type,
        department: staff.medicalDepartment,
        service: chosenService,
        status,
        visitNotes: isCompleted ? template.notes : "",
        completedAt,
        isDemo: true,
        createdAt,
      });

      apptCount++;
    }
  }
  console.log(`   + Created ${apptCount} realistic demo appointments.`);

  // 4. Create 15 emergency incidents across last 14 days
  console.log("\n4. Generating 15 demo emergency incidents...");
  let emgCount = 0;
  for (let i = 0; i < EMERGENCY_INCIDENTS.length; i++) {
    const inc = EMERGENCY_INCIDENTS[i];
    const student = students[i % students.length];
    const staff = staffMembers[i % staffMembers.length];

    // Spread over last 14 days
    const dayOffset = 13 - Math.floor((i * 13) / EMERGENCY_INCIDENTS.length);
    const d = new Date();
    d.setDate(d.getDate() - dayOffset);
    d.setHours(9 + (i * 3) % 12, 10 + (i * 7) % 50, 0, 0);

    // Realistic response time in seconds (45 to 380)
    const responseTimeSeconds = 50 + (i * 22) % 320;
    const isLatest = i >= EMERGENCY_INCIDENTS.length - 2; // last 2 are in responded state
    const status = isLatest ? "responded" : "resolved";

    const respondedAt = new Date(d.getTime() + responseTimeSeconds * 1000);
    const resolvedAt = isLatest ? null : new Date(respondedAt.getTime() + (700 + i * 80) * 1000);

    const existingEmg = await Emergency.findOne({ student: student._id, description: inc.description });
    if (existingEmg) {
      continue;
    }

    const needsAmbulance = inc.type === "medical" || inc.type === "injury";
    const dispatchStartedAt = needsAmbulance ? d : null;
    const ambulanceAcceptedAt = needsAmbulance
      ? new Date(d.getTime() + (25 + (i * 11) % 55) * 1000)
      : null;

    await Emergency.create({
      student: student._id,
      type: inc.type,
      description: inc.description,
      location: {
        latitude: Number((BASE_CAMPUS_LAT + inc.latOffset).toFixed(6)),
        longitude: Number((BASE_CAMPUS_LNG + inc.lngOffset).toFixed(6)),
        address: "Campus Ground",
        manualLocation: inc.locationName,
      },
      status,
      respondedBy: staff._id,
      respondedAt,
      resolvedAt,
      responseTimeSeconds,
      needsAmbulance,
      ambulanceStatus: needsAmbulance ? (isLatest ? "accepted" : "completed") : "none",
      dispatchStartedAt,
      ambulanceAcceptedAt,
      pickedUpAt: needsAmbulance ? new Date(d.getTime() + (120 + (i * 15) % 150) * 1000) : null,
      ambulanceCompletedAt: needsAmbulance && !isLatest ? new Date(respondedAt.getTime() + 600000) : null,
      isDemo: true,
      createdAt: d,
    });
    emgCount++;
  }
  console.log(`   + Created ${emgCount} geo-located demo emergency incidents.`);

  // 5. Generate live unbooked slots for today & tomorrow for all clinicians
  console.log("\n5. Generating live unbooked slots for today & tomorrow across departments...");
  const slotTimes = [
    { start: "09:30", end: "10:00" },
    { start: "10:30", end: "11:00" },
    { start: "11:30", end: "12:00" },
    { start: "14:00", end: "14:30" },
    { start: "15:00", end: "15:30" },
    { start: "16:00", end: "16:30" },
  ];
  const now = new Date();
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  let liveSlotCount = 0;
  for (const staff of staffMembers) {
    for (const dStr of [todayDateStr, tomorrowDateStr]) {
      for (const st of slotTimes) {
        const existing = await Availability.findOne({
          staff: staff._id,
          date: dStr,
          startTime: st.start,
        });

        if (!existing) {
          await Availability.create({
            staff: staff._id,
            date: dStr,
            startTime: st.start,
            endTime: st.end,
            isBooked: false,
            isDemo: true,
          });
          liveSlotCount++;
        }
      }
    }
  }
  console.log(`   + Created ${liveSlotCount} live unbooked slots for today & tomorrow.`);

  // 6. Generate ~15 Demo Medical Reports and Access Audit Logs
  console.log("\n6. Seeding demo diagnostic reports and access audit logs...");
  const DEMO_REPORTS = [
    {
      studentIdx: 0,
      staffIdx: 0,
      category: "Blood Test",
      title: "Complete Blood Count (CBC) Panel",
      summary: "Hemoglobin: 14.8 g/dL (normal). WBC: 6,800/mcL (normal). Platelet count: 240,000/mcL. Erythrocyte sedimentation rate within baseline. No signs of infection or anemia.",
      condition: "normal",
      daysAgo: 1,
      viewed: true,
    },
    {
      studentIdx: 0,
      staffIdx: 0,
      category: "General Checkup",
      title: "Annual Student Physical & Fitness Clearance",
      summary: "Blood pressure 118/76 mmHg. Resting pulse 72 bpm. Clear lung sounds bilaterally. Normal cardiac rhythm. Cleared for all intramural university sports.",
      condition: "normal",
      daysAgo: 8,
      viewed: true,
    },
    {
      studentIdx: 1,
      staffIdx: 1,
      category: "Skin Report",
      title: "Dermatology Contact Allergy Assessment",
      summary: "Erythematous macular patches on right forearm. Suspected allergic dermatitis from botanical irritants. Topical hydrocortisone 1% prescribed for 5 days.",
      condition: "follow-up-needed",
      daysAgo: 2,
      viewed: false,
    },
    {
      studentIdx: 1,
      staffIdx: 2,
      category: "Blood Test",
      title: "Serum Ferritin & Iron Studies",
      summary: "Serum ferritin 18 ng/mL (borderline low). Serum iron 45 mcg/dL. Dietary iron supplementation and follow-up lab recommended in 4 weeks.",
      condition: "follow-up-needed",
      daysAgo: 5,
      viewed: true,
    },
    {
      studentIdx: 2,
      staffIdx: 3,
      category: "X-Ray",
      title: "Right Ankle Joint (AP & Lateral)",
      summary: "No cortical fracture or joint dislocation identified. Soft tissue swelling observed along lateral malleolus consistent with Grade 1 ligament sprain.",
      condition: "follow-up-needed",
      daysAgo: 3,
      viewed: true,
    },
    {
      studentIdx: 2,
      staffIdx: 0,
      category: "Prescription",
      title: "Post-Injury Pain & NSAID Regimen",
      summary: "Naproxen 500mg twice daily with meals for 5 days. R.I.C.E. protocol advised. Crutches provided for mobility assistance.",
      condition: "normal",
      daysAgo: 3,
      viewed: false,
    },
    {
      studentIdx: 3,
      staffIdx: 2,
      category: "Typhoid Test",
      title: "Widal Antigen Titre Screen",
      summary: "S. typhi 'O' titre 1:40 (negative). S. typhi 'H' titre 1:80 (negative). Widal test negative for active enteric fever infection.",
      condition: "normal",
      daysAgo: 4,
      viewed: true,
    },
    {
      studentIdx: 3,
      staffIdx: 2,
      category: "Urine Test",
      title: "Routine Urine Microscopic Examination",
      summary: "Color: pale yellow. Specific gravity 1.015. Protein negative, Glucose negative. Leucocytes 1-2/hpf. Clean urinalysis report.",
      condition: "normal",
      daysAgo: 10,
      viewed: true,
    },
    {
      studentIdx: 4,
      staffIdx: 2,
      category: "Malaria and Dengue Test",
      title: "Dengue NS1 Antigen & Rapid Smear",
      summary: "Dengue NS1 Rapid Antigen: Negative. Dengue IgM/IgG: Negative. Peripheral blood smear negative for malarial parasites.",
      condition: "normal",
      daysAgo: 6,
      viewed: false,
    },
    {
      studentIdx: 4,
      staffIdx: 0,
      category: "General Checkup",
      title: "Viral Pyrexia Follow-up & Vitals",
      summary: "Temperature normal (98.4 F). Hydration adequate. Advised oral rehydration fluids and rest for 48 hours.",
      condition: "normal",
      daysAgo: 6,
      viewed: true,
    },
    {
      studentIdx: 5,
      staffIdx: 3,
      category: "Ultrasound",
      title: "Abdominal & Pelvic Ultrasound",
      summary: "Liver, gallbladder, pancreas and kidneys are normal in size and echotexture. No calculus or focal masses seen. Normal abdominal scan.",
      condition: "normal",
      daysAgo: 7,
      viewed: true,
    },
    {
      studentIdx: 5,
      staffIdx: 0,
      category: "Prescription",
      title: "Migraine Prophylaxis & Symptom Management",
      summary: "Sumatriptan 50mg as needed at migraine onset. Sleep hygiene and hydration counseling completed.",
      condition: "normal",
      daysAgo: 11,
      viewed: false,
    },
    {
      studentIdx: 6,
      staffIdx: 2,
      category: "Blood Test",
      title: "Fasting Blood Glucose & HbA1c Screen",
      summary: "Fasting blood sugar: 92 mg/dL. HbA1c: 5.3% (within optimal non-diabetic range). Lipid profile within normal limits.",
      condition: "normal",
      daysAgo: 9,
      viewed: true,
    },
    {
      studentIdx: 6,
      staffIdx: 3,
      category: "X-Ray",
      title: "Chest Radiograph (PA View)",
      summary: "Normal bronchovascular markings. Both lung fields clear. Cardiothoracic ratio is normal (<0.5). Normal chest study.",
      condition: "normal",
      daysAgo: 12,
      viewed: true,
    },
    {
      studentIdx: 7,
      staffIdx: 0,
      category: "Blood Test",
      title: "Infectious Mononucleosis Rapid Screen",
      summary: "Heterophile antibody rapid agglutination test positive. Elevated atypical lymphocytes (14%). Marked fatigue and pharyngitis noted.",
      condition: "critical",
      daysAgo: 2,
      viewed: false,
    },
  ];

  let reportCount = 0;
  let logCount = 0;

  for (const item of DEMO_REPORTS) {
    const student = students[item.studentIdx];
    const staff = staffMembers[item.staffIdx % staffMembers.length];
    const createdDate = new Date(Date.now() - item.daysAgo * 86400000);
    const reportDateStr = createdDate.toISOString().split("T")[0];

    const existingRpt = await Report.findOne({
      student: student._id,
      title: item.title,
    });

    let reportId = existingRpt?._id;

    if (!existingRpt) {
      const newRpt = await Report.create({
        student: student._id,
        uploadedBy: staff._id,
        category: item.category,
        title: item.title,
        summary: item.summary,
        condition: item.condition,
        reportDate: reportDateStr,
        hasFile: false,
        viewedByStudentAt: item.viewed ? new Date(createdDate.getTime() + 3600000) : null,
        isDemo: true,
        createdAt: createdDate,
      });
      reportId = newRpt._id;
      reportCount++;
    }

    // Access logs: lookup and upload
    await AccessLog.create({
      staff: staff._id,
      student: student._id,
      action: "lookup",
      isDemo: true,
      createdAt: new Date(createdDate.getTime() - 120000),
    });
    logCount++;

    await AccessLog.create({
      staff: staff._id,
      student: student._id,
      action: "upload-report",
      report: reportId,
      isDemo: true,
      createdAt: createdDate,
    });
    logCount++;

    if (item.viewed) {
      await AccessLog.create({
        staff: staff._id,
        student: student._id,
        action: "view-report",
        report: reportId,
        isDemo: true,
        createdAt: new Date(createdDate.getTime() + 7200000),
      });
      logCount++;
    }
  }
  console.log(`   + Created ${reportCount} diagnostic medical reports.`);
  console.log(`   + Created ${logCount} access audit log entries.`);

  // 7. Create Demo Reviews for ~60% of completed demo appointments
  console.log("\n7. Generating demo doctor reviews for completed visits...");
  const completedAppts = await Appointment.find({ isDemo: true, status: "completed" });
  let reviewCount = 0;

  const REVIEW_TEMPLATES = [
    { rating: 5, comment: "Doctor was extremely caring and attentive. Explained everything thoroughly!", isAnonymous: false },
    { rating: 5, comment: "Prompt consultation, accurate prescription, and friendly staff. Highly satisfied.", isAnonymous: false },
    { rating: 5, comment: "Best doctor visit on campus. Made me feel completely at ease.", isAnonymous: true },
    { rating: 4, comment: "Good consultation and practical health advice. Short wait time in clinic.", isAnonymous: false },
    { rating: 4, comment: "Helpful doctor. Prescribed effective medications for my symptoms.", isAnonymous: true },
    { rating: 5, comment: "Took extra time to discuss my preventative wellness and routine checkup.", isAnonymous: false },
    { rating: 4, comment: "Professional demeanor and clean consultation room.", isAnonymous: false },
    { rating: 3, comment: "Decent visit, though the queue was slightly long before getting called in.", isAnonymous: true },
    { rating: 5, comment: "Compassionate bedside manner and very clear instructions on medicine dosage.", isAnonymous: false },
    { rating: 4, comment: "Resolved my issue quickly with a clear follow-up plan.", isAnonymous: false },
    { rating: 5, comment: "Doctor listened patiently without rushing. Truly appreciated the care.", isAnonymous: false },
    { rating: 3, comment: "Felt a bit rushed during the consultation, but diagnosis was accurate.", isAnonymous: true },
  ];

  for (let i = 0; i < completedAppts.length; i++) {
    // Pick roughly 60% of completed appointments (indices 0, 2, 4 in every 5)
    if (i % 5 === 1 || i % 5 === 3) continue;

    const appt = completedAppts[i];
    const existing = await Review.findOne({ appointment: appt._id });
    if (existing) continue;

    const template = REVIEW_TEMPLATES[i % REVIEW_TEMPLATES.length];
    const baseDate = appt.completedAt ? new Date(appt.completedAt) : new Date(appt.createdAt);
    const reviewDate = new Date(baseDate.getTime() + 1800000);

    await Review.create({
      student: appt.student,
      doctor: appt.staff,
      appointment: appt._id,
      rating: template.rating,
      comment: template.comment,
      isAnonymous: template.isAnonymous,
      isDemo: true,
      createdAt: reviewDate,
    });
    reviewCount++;
  }
  console.log(`   + Created ${reviewCount} patient reviews for completed appointments.`);

  // 7. Seed 4 Demo Ambulances (AMB-01 to AMB-04)
  console.log("\n7. Ensuring 4 demo ambulances exist...");
  const DEMO_AMBULANCES = [
    {
      driverName: "Marcus Vance",
      email: "ambulance1@demo.edu",
      phone: "9876543230",
      vehicleNumber: "AMB-01",
      type: "advanced",
      status: "available",
      lat: BASE_CAMPUS_LAT + 0.012, // ~1.3 km north
      lng: BASE_CAMPUS_LNG + 0.008,
    },
    {
      driverName: "Elena Rostova",
      email: "ambulance2@demo.edu",
      phone: "9876543231",
      vehicleNumber: "AMB-02",
      type: "basic",
      status: "available",
      lat: BASE_CAMPUS_LAT - 0.021, // ~2.3 km south
      lng: BASE_CAMPUS_LNG + 0.015,
    },
    {
      driverName: "James Cooper",
      email: "ambulance3@demo.edu",
      phone: "9876543232",
      vehicleNumber: "AMB-03",
      type: "advanced",
      status: "available",
      lat: BASE_CAMPUS_LAT + 0.035, // ~3.9 km north
      lng: BASE_CAMPUS_LNG - 0.022,
    },
    {
      driverName: "Sarah Connor",
      email: "ambulance4@demo.edu",
      phone: "9876543233",
      vehicleNumber: "AMB-04",
      type: "basic",
      status: "available",
      lat: BASE_CAMPUS_LAT - 0.045, // ~5.0 km south
      lng: BASE_CAMPUS_LNG - 0.030,
    },
  ];

  let ambCount = 0;
  for (const a of DEMO_AMBULANCES) {
    let user = await User.findOne({ email: a.email });
    if (!user) {
      user = await User.create({
        name: a.driverName,
        email: a.email,
        password: hashedPassword,
        role: "ambulance",
        phone: a.phone,
        isDemo: true,
      });
    }

    let amb = await Ambulance.findOne({ vehicleNumber: a.vehicleNumber });
    if (!amb) {
      await Ambulance.create({
        user: user._id,
        vehicleNumber: a.vehicleNumber,
        type: a.type,
        driverName: a.driverName,
        driverPhone: a.phone,
        status: a.status,
        location: {
          latitude: a.lat,
          longitude: a.lng,
          updatedAt: new Date(),
        },
        isDemo: true,
      });
      ambCount++;
    }
  }
  console.log(`   + Created/verified 4 demo ambulances (AMB-01 to AMB-04).`);

  // ── 9. Seed Demo Referrals ───────────────────────────────────────────
  console.log("Seeding demo referrals...");
  const demoReferrals = [
    {
      patient: students[0]._id,
      fromDoctor: staffMembers[0]._id, // Dr. Sarah Jenkins
      toDoctor: staffMembers[3]._id,   // Dr. Anita Desai (Dermatology)
      urgency: "urgent",
      reason: "Persistent severe skin rash unresponsive to general antihistamines.",
      note: "Patient reports flare-ups following antibiotic course. Please evaluate for contact dermatitis or drug reaction.",
      status: "pending",
      type: "single",
    },
    {
      patient: students[1]._id,
      fromDoctor: staffMembers[0]._id, // Dr. Sarah Jenkins
      toDoctor: staffMembers[4]._id,   // Dr. Rajesh Gupta (Pathology)
      urgency: "routine",
      reason: "Suspected Typhoid infection; comprehensive blood work requested.",
      note: "Continuous fever of 102F for 4 days. Widal test and CBC requested.",
      status: "accepted",
      respondedAt: new Date(Date.now() - 3600 * 1000 * 4),
      responseNote: "Accepted. Fasting blood sample scheduled for tomorrow morning.",
      type: "single",
    },
    {
      patient: students[2]._id,
      fromDoctor: staffMembers[0]._id, // Dr. Sarah Jenkins
      toDoctor: staffMembers[1]._id,   // Dr. Marcus Vance (Counseling)
      urgency: "urgent",
      reason: "Severe panic attacks and academic stress evaluation.",
      note: "Patient presented with tachycardia and hyperventilation during midterms.",
      status: "pending",
      type: "single",
    },
    {
      patient: students[3]._id,
      fromDoctor: staffMembers[3]._id, // Dr. Anita Desai
      toDoctor: staffMembers[1]._id,   // Dr. Marcus Vance
      urgency: "routine",
      reason: "Trichotillomania and severe stress-induced hair loss.",
      note: "Patient expresses significant academic anxiety alongside dermatological symptoms.",
      status: "accepted",
      respondedAt: new Date(Date.now() - 3600 * 1000 * 12),
      responseNote: "Initial wellness intake scheduled. Thank you for the referral.",
      type: "single",
    },
    {
      patient: students[4]._id,
      fromDoctor: staffMembers[0]._id, // Dr. Sarah Jenkins
      toDoctor: staffMembers[5]._id,   // Dr. Kevin Miller (Dental)
      urgency: "routine",
      reason: "Acute third molar impaction with secondary localized lymphadenopathy.",
      note: "Prescribed analgesics. Patient requires dental surgical evaluation.",
      status: "declined",
      respondedAt: new Date(Date.now() - 3600 * 1000 * 24),
      responseNote: "Dental surgical clinic at capacity today; recommend referral to university dental hospital.",
      type: "single",
    },
    {
      patient: students[5]._id,
      fromDoctor: staffMembers[2]._id, // Nurse Priya Sharma (Emergency)
      toDoctor: staffMembers[0]._id,   // Dr. Sarah Jenkins
      urgency: "routine",
      reason: "Post-emergency discharge follow-up for sports injury.",
      note: "Wound dressed on-scene. Needs sutures removed in 5 days.",
      status: "accepted",
      respondedAt: new Date(Date.now() - 3600 * 1000 * 6),
      responseNote: "Accepted. Will evaluate for suture removal on Thursday.",
      type: "single",
    },
    {
      patient: students[6]._id,
      fromDoctor: staffMembers[1]._id, // Dr. Marcus Vance
      toDoctor: staffMembers[0]._id,   // Dr. Sarah Jenkins
      urgency: "routine",
      type: "emergency-leave",
      batchId: "batch_demo_leave_01",
      reason: "Emergency Medical Leave: Attending physician unavailable.",
      note: "Automatic transfer for scheduled consultation.",
      status: "pending",
    },
    {
      patient: students[7]._id,
      fromDoctor: staffMembers[1]._id, // Dr. Marcus Vance
      toDoctor: staffMembers[0]._id,   // Dr. Sarah Jenkins
      urgency: "routine",
      type: "emergency-leave",
      batchId: "batch_demo_leave_01",
      reason: "Emergency Medical Leave: Attending physician unavailable.",
      note: "Automatic transfer for scheduled follow-up visit.",
      status: "pending",
    },
  ];

  let referralCount = 0;
  for (const r of demoReferrals) {
    await Referral.create({
      ...r,
      isDemo: true,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 2)),
    });
    referralCount++;
  }
  console.log(`   + Created ${referralCount} demo referrals.`);

  // ── 10. Seed Demo Notifications ─────────────────────────────────────
  console.log("Seeding demo notifications...");
  const demoNotifications = [
    {
      user: staffMembers[3]._id,
      type: "referral-request",
      title: "New Patient Referral Request",
      message: `Dr. Sarah Jenkins has referred patient ${students[0].name} for urgent dermatology consultation.`,
      link: "/staff/referrals",
      isRead: false,
    },
    {
      user: staffMembers[1]._id,
      type: "referral-request",
      title: "New Patient Referral Request",
      message: `Dr. Sarah Jenkins has referred patient ${students[2].name} for urgent counseling assessment.`,
      link: "/staff/referrals",
      isRead: false,
    },
    {
      user: staffMembers[0]._id,
      type: "referral-accepted",
      title: "Referral Accepted",
      message: `Dr. Rajesh Gupta accepted your referral for ${students[1].name}.`,
      link: "/staff/referrals",
      isRead: true,
    },
    {
      user: staffMembers[0]._id,
      type: "referral-declined",
      title: "Referral Declined",
      message: `Dr. Kevin Miller declined your referral for ${students[4].name}. Note: Dental surgical clinic at capacity today.`,
      link: "/staff/referrals",
      isRead: true,
    },
    {
      user: staffMembers[0]._id,
      type: "appointment-update",
      title: "New Appointment Booked",
      message: `${students[0].name} booked a General Checkup consultation.`,
      link: "/staff/appointments",
      isRead: false,
    },
    {
      user: staffMembers[0]._id,
      type: "referral-request",
      title: "Emergency Leave Transfer (2 Patients)",
      message: `Dr. Marcus Vance had to take emergency leave and transferred 2 patients to your schedule.`,
      link: "/staff/referrals",
      isRead: false,
    },
    {
      user: students[0]._id,
      type: "appointment-update",
      title: "Appointment Confirmed",
      message: `Your appointment with Dr. Sarah Jenkins has been confirmed.`,
      link: "/student/appointments",
      isRead: true,
    },
    {
      user: students[0]._id,
      type: "referral-request",
      title: "Specialist Referral Initiated",
      message: `Dr. Sarah Jenkins referred you to Dr. Anita Desai in Dermatology for consultation.`,
      link: "/student/appointments",
      isRead: false,
    },
    {
      user: students[1]._id,
      type: "report-ready",
      title: "Medical Report Available",
      message: `Your Blood Test report has been uploaded and is ready for review.`,
      link: "/student/reports",
      isRead: false,
    },
    {
      user: students[1]._id,
      type: "referral-accepted",
      title: "Referral Accepted",
      message: `Dr. Rajesh Gupta accepted your pathology referral. Fasting blood sample scheduled.`,
      link: "/student/appointments",
      isRead: true,
    },
    {
      user: students[2]._id,
      type: "appointment-update",
      title: "Appointment Reminder",
      message: `Upcoming appointment scheduled for tomorrow at 10:00 AM.`,
      link: "/student/appointments",
      isRead: false,
    },
    {
      user: students[3]._id,
      type: "referral-accepted",
      title: "Counseling Referral Confirmed",
      message: `Dr. Marcus Vance accepted your wellness intake referral.`,
      link: "/student/appointments",
      isRead: false,
    },
    {
      user: students[6]._id,
      type: "appointment-transferred",
      title: "Appointment Transferred",
      message: `Due to doctor emergency leave, your appointment was safely transferred to Dr. Sarah Jenkins.`,
      link: "/student/appointments",
      isRead: false,
    },
    {
      user: students[7]._id,
      type: "appointment-transferred",
      title: "Appointment Transferred",
      message: `Due to doctor emergency leave, your appointment was safely transferred to Dr. Sarah Jenkins.`,
      link: "/student/appointments",
      isRead: false,
    },
    {
      user: students[0]._id,
      type: "ambulance-update",
      title: "Ambulance Dispatched",
      message: `Ambulance AMB-01 accepted your emergency dispatch request and is en route.`,
      link: "/emergency",
      isRead: true,
    },
    {
      user: students[0]._id,
      type: "ambulance-update",
      title: "Ambulance On-Scene",
      message: `Ambulance AMB-01 has arrived at your campus location.`,
      link: "/emergency",
      isRead: true,
    },
    {
      user: students[4]._id,
      type: "general",
      title: "Campus Health Advisory",
      message: `Annual seasonal influenza vaccinations are now available at the main health center.`,
      link: "/student/dashboard",
      isRead: false,
    },
    {
      user: students[5]._id,
      type: "general",
      title: "Wellness Workshop",
      message: `Stress management and mindfulness seminar this Friday at the Student Center.`,
      link: "/student/dashboard",
      isRead: true,
    },
    {
      user: staffMembers[4]._id,
      type: "general",
      title: "Pathology Lab Maintenance",
      message: `Scheduled calibration of hematology analyzer tomorrow from 07:00 to 09:00.`,
      link: "/staff/dashboard",
      isRead: true,
    },
    {
      user: staffMembers[5]._id,
      type: "general",
      title: "Dental Clinic Supplies",
      message: `Dental sterilization supplies restocked in operatory 2.`,
      link: "/staff/dashboard",
      isRead: false,
    },
  ];

  let notifCount = 0;
  for (const n of demoNotifications) {
    await Notification.create({
      ...n,
      isDemo: true,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 3)),
    });
    notifCount++;
  }
  console.log(`   + Created ${notifCount} demo notifications.`);

  console.log(`\n🎉 Demo Data Seed Completed Successfully!`);
  console.log(`   - 8 Students (email: student1@demo.edu .. student8@demo.edu, password: Demo@12345)`);
  console.log(`   - 4 Ambulances (AMB-01 to AMB-04, driver logins ambulance1@demo.edu .. ambulance4@demo.edu, password: Demo@12345)`);
  console.log(`   - ${staffMembers.length} Staff Clinicians (${staffMembers.map(s => s.name.split(",")[0]).join(", ")})`);
  console.log(`   - ${apptCount} Appointments with department and service tags`);
  console.log(`   - ${reviewCount} Doctor reviews with varied star ratings`);
  console.log(`   - ${referralCount} Doctor referrals across departments`);
  console.log(`   - ${notifCount} In-app user notifications`);
  console.log(`   - ${liveSlotCount} Open availability slots for live booking`);
  console.log(`   - ${emgCount} Emergencies with telemetry and response times`);
  console.log(`   Run 'npm run clear:demo' at any time to remove all demo data.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Error seeding demo data:", err);
  process.exit(1);
});
