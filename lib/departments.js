export const DEPARTMENTS = [
  {
    key: "general-medicine",
    name: "General Medicine",
    icon: "Stethoscope",
    description: "Primary clinical consultations, fevers, routine health checkups & viral infections",
    services: [
      "Normal Checkup",
      "Fever",
      "Cold and Cough",
      "Typhoid",
      "Other Consultation",
    ],
  },
  {
    key: "dermatology",
    name: "Dermatology (Skin)",
    icon: "Sparkles",
    description: "Treatment for skin rashes, allergies, acne, hair concerns and dermatological conditions",
    services: [
      "Skin Consultation",
      "Allergy",
      "Acne and Hair",
      "Other",
    ],
  },
  {
    key: "pathology-lab",
    name: "Pathology Lab",
    icon: "FlaskConical",
    description: "On-campus diagnostic blood, urine and pathogen screening laboratory tests",
    services: [
      "Blood Test",
      "Urine Test",
      "Typhoid Test",
      "Malaria and Dengue Test",
      "Other Test",
    ],
  },
  {
    key: "radiology",
    name: "Radiology (X-Ray)",
    icon: "Scan",
    description: "Diagnostic digital X-rays, ultrasound imaging & radiological scans",
    services: [
      "X-Ray",
      "Ultrasound",
      "Other Scan",
    ],
  },
  {
    key: "counseling",
    name: "Counseling",
    icon: "HeartHandshake",
    description: "Confidential mental health, stress management, academic guidance & wellness therapy",
    services: [
      "Stress and Anxiety",
      "Academic Counseling",
      "Other",
    ],
  },
  {
    key: "dental",
    name: "Dental",
    icon: "Smile",
    description: "Preventative dental examinations, acute toothache relief, cleanings and oral health",
    services: [
      "Dental Checkup",
      "Tooth Pain",
      "Other",
    ],
  },
  {
    key: "ent",
    name: "ENT",
    icon: "Ear",
    description: "Specialized care for ear, nose, throat discomfort, hearing and sinus conditions",
    services: [
      "ENT Consultation",
      "Other",
    ],
  },
  {
    key: "emergency",
    name: "Emergency",
    icon: "AlertTriangle",
    description: "Urgent post-stabilization care, triage reviews and critical medical follow-ups",
    services: [
      "Emergency Follow-up",
    ],
  },
];

export function getDepartmentByKey(key) {
  if (!key) return null;
  return DEPARTMENTS.find(
    (d) => d.key.toLowerCase() === String(key).toLowerCase()
  ) || null;
}

export function getDepartmentByName(name) {
  if (!name) return null;
  return DEPARTMENTS.find(
    (d) => d.name.toLowerCase() === String(name).toLowerCase()
  ) || null;
}
