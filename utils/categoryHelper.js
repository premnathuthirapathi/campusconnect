// utils/categoryHelper.js
const categories = {
"Events": [
    "seminar", "workshop", "cultural", "guest lecture", "tech fest",
    "conference", "webinar", "celebration", "event schedule", "annual day"
  ],
"Academic": [
    "syllabus", "assignments", "curriculum", "class schedule",
    "study material", "lesson plan", "attendance", "academic calendar",
    "faculty schedule", "notes", "online class", "course registration"
  ],
  "Examination": [
    "exam schedule", "results", "hall ticket", "internal assessment",
    "revaluation", "marks", "exam fee", "question paper", "model exam",
    "exam pattern", "practical exam", "exam center", "exam rules", "Time table", "Viva"
  ],
  "Placement": [
    "interview", "recruitment", "company visit", "internship", "job fair",
    "offer letter", "HR talk", "campus drive", "resume submission",
    "aptitude test", "placement training", "pre-placement talk",
    "mock interview", "skill test"
  ],
  "Department Circulars": [
    "dept notice", "internal meeting", "lab schedule", "faculty announcement",
    "project submission", "department update", "work allocation",
    "internal circular", "faculty meeting", "lab maintenance",
    "department rules", "committee meeting", "project review"
  ],
  "CELLS": [
    "NSS", "NCC", "IQAC", "Research Cell", "Entrepreneurship Cell",
    "Innovation Cell", "Grievance Cell", "Anti-ragging Cell", "Alumni Cell",
    "Women's Cell", "Eco Club", "Social Responsibility", "Student Council"
  ]
};

function getCategory(title) {
  if (!title) return "General"; // Default if no title provided

  title = title.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => title.includes(keyword))) {
      return category;
    }
  }
  return "General"; // Return Others if no keywords match
}

module.exports = { getCategory };
