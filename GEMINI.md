# Firestore Database Optimization & Data Handling Guidelines

- **Raw Data Retention**: Always save the complete/raw form of the user's data (e.g., trait score percentages, specific answers) as individual documents when they complete an action like a test.
- **Counters & Dashboards (Read Optimization)**: Never fetch the entire collection of raw data to calculate sums, averages, or counts for a Dashboard or Chart. Instead, maintain an aggregated "Counters" document (e.g., stats/testCounters). When a user submits new raw data, use a Firebase transaction or increment() to update the Counters document simultaneously. Dashboards must read only the Counters document to generate charts quickly and cheaply.
