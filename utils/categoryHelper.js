// utils/categoryHelper.js
const categories = {
  "Technology": ["tech", "software", "computer", "ai"],
  "Business": ["finance", "business", "startup", "investment"],
  "Health": ["medicine", "health", "fitness", "doctor"],
  "Education": ["school", "college", "university", "learning"]
};

function getCategory(title) {
  if (!title) return "Others"; // Default if no title provided

  title = title.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => title.includes(keyword))) {
      return category;
    }
  }
  return "Others"; // Return Others if no keywords match
}

module.exports = { getCategory };
