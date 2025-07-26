SmartApply: AI-Powered Job Application Platform
SmartApply is a modern web application designed to streamline the job search and application process using AI. It allows users to upload their resumes, extract key skills, find matching job opportunities, and simulate auto-applications, all while tracking their progress through a comprehensive dashboard.

✨ Features
Resume Upload & Parsing: Upload your resume (TXT or PDF) and let the AI extract relevant skills.

AI-Powered Job Matching: Finds simulated job opportunities based on your extracted skills. (Note: Requires a separate backend scraper for real job data).

Auto-Apply Simulation: Simulates applying to jobs, updating application statuses, and providing instant feedback.

Application Status Dashboard: A visual dashboard to track applied jobs, jobs under review, and scheduled interviews.

Application Calendar: Visualize your job application timeline and upcoming interviews.

Resume Analysis & Improvements: Get insights into your resume's strengths and receive suggestions for improvement.

ATS Resume Checker: (Simulated) Upload your resume to get an Applicant Tracking System (ATS) compatibility score and breakdown.

Resume Conversion & Cover Letter Generation: Tailor your resume for specific companies and generate professional cover letters using AI.

Multi-Resume Support: Manage multiple resumes for different job profiles.

Notifications & Alerts: Get alerts for new job matches (simulated).

Data Export: Export your application data to CSV.

User Authentication: Secure user login and signup using Supabase (Email/Password and Google OAuth).

🚀 Technologies Used
Frontend:

React (with TypeScript)

Tailwind CSS for styling

Recharts for data visualization

React Calendar for date visualization

React Toastify for notifications

Backend/Database (External Dependencies):

Supabase: Used for user authentication and data persistence (user profiles, applied jobs, settings).

Google Gemini API: Used for AI functionalities like skill extraction, resume conversion, and cover letter generation.

Job Scraper Backend (External/Simulated): The application expects a local Node.js backend running at http://localhost:3000/scraper/find-jobs to fetch real job data. Without it, the application will use static demo job data.

PDF.js: Used for parsing PDF resumes (loaded via CDN).

⚙️ Setup and Installation
Follow these steps to get SmartApply up and running on your local machine.

Prerequisites
Node.js (v18 or higher recommended)

npm or Yarn

1. Clone the Repository
git clone <repository-url> # Replace with your repository URL
cd smartapply-frontend # Or whatever your project folder is named

2. Install Frontend Dependencies
npm install
# or
yarn install

3. Set up Supabase
SmartApply uses Supabase for authentication and storing user data.

Create a Supabase Project:

Go to Supabase and create a new project.

Note down your Project URL and anon public key. These are used in supabaseUrl and supabaseAnonKey in src/App.tsx.

Google Gemini API Key
Obtain a Google Gemini API key from the Google AI Studio or Google Cloud Console.

Replace "AIzaSyDKJx_nV7s58ig2jw3Biiu1nr5xePTtVCM" with your actual API key in src/App.tsx:

const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";

Note: For production applications, it's highly recommended to store API keys as environment variables, not directly in the code.

5. Job Scraper Backend (Optional but Recommended)
The application attempts to fetch real job data from http://localhost:3000/scraper/find-jobs. This requires a separate backend service that can scrape job boards.

If you do NOT set up a backend scraper: The application will gracefully fall back to using demoJobs (static data) for job suggestions. The core functionality of skill extraction and auto-apply simulation will still work.

If you want real job data: You will need to build and run a Node.js (or Python, etc.) backend that exposes an endpoint at http://localhost:3000/scraper/find-jobs that accepts a POST request with keywords and returns a JSON array of job objects.

6. Run the Development Server
npm start
# or
yarn start

This will open the application in your browser, usually at http://localhost:3000.

🚀 Usage
Home Page: Upon loading, you'll see the main landing page.

Upload Resume: Click "Upload & Auto-Apply" and select a .txt or .pdf resume file.

Auto-Apply & Redirect: The application will process your resume, extract skills, and automatically "apply" to simulated jobs. You will then be redirected to the "Application Status" page.

Explore Dashboard & Status: Navigate between "Dashboard" and "Application Status" using the navigation bar to see your simulated application progress and statistics.

ATS & Resume Convert: Explore the "ATS" and "Resume Convert" sections for additional tools.

Login/Signup: Use the "Login" or "Sign Up" buttons in the navigation bar to create an account or sign in. Your data will be persisted with Supabase.

🤝 Contributing
Contributions are welcome! If you have suggestions or find issues, please open an issue or submit a pull request.

📄 License
This project is licensed under the MIT License.
