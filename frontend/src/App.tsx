import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import ResumeUpload from './components/ResumeUpload';
import AutoApplySettings from './components/AutoApplySettings';
import ExtractedSkills from './components/ExtractedSkills';
import GeneratedJobs from './components/GeneratedJobs';
import ApplicationStatusDashboard from './components/ApplicationStatusDashboard';
import InsightsImprovements from './components/InsightsImprovements';
import AppliedJobsList from './components/AppliedJobsList';
import AuthForm from './components/AuthForm';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const supabaseUrl = 'https://jkncoigtkssuounskowa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprbmNvaWd0a3NzdW91bnNrb3dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODgyMzAsImV4cCI6MjA2ODk2NDIzMH0.cHY8nW1zKpCGnUOVHrh8qr37Mv3jjiahoPjNxGsXwKI';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// NOTE: Run: npm install @supabase/supabase-js
const GEMINI_API_KEY = "AIzaSyDKJx_nV7s58ig2jw3Biiu1nr5xePTtVCM";
function exportJobsToCSV(jobs: any[], filename: string) {
  if (!jobs.length) return;
  const headers = Object.keys(jobs[0]).filter(k => typeof jobs[0][k] !== 'object');
  const csvRows = [headers.join(',')];
  for (const job of jobs) {
    const row = headers.map(h => '"' + String(job[h] ?? '').replace(/"/g, '""') + '"').join(',');
    csvRows.push(row);
  }
  const csv = csvRows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const App = () => {
    // Supabase States
    const [user, setUser] = useState<any>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [currentPage, setCurrentPage] = useState<'home' | 'dashboard' | 'application-status' | 'ats' | 'resume-convert'>('home');
    const [resumeText, setResumeText] = useState('');
    const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
    const [generatedJobs, setGeneratedJobs] = useState<any[]>([]);
    const [isLoadingSkills, setIsLoadingSkills] = useState(false);
    const [isLoadingJobs, setIsLoadingJobs] = useState(false);
    const [message, setMessage] = useState('');
    const [isAutoApplied, setIsAutoApplied] = useState(false);
    const [appliedJobsCount, setAppliedJobsCount] = useState(0);
    const [inReviewJobsCount, setInReviewJobsCount] = useState(0);
    const [interviewScheduledCount, setInterviewScheduledCount] = useState(0);
    const [responseRate, setResponseRate] = useState(0);
    const [successScore, setSuccessScore] = useState(0);
    const [appPerformance, setAppPerformance] = useState({ responseRate: 0, interviewRate: 0, profileViews: 0 });
    const [improvementSuggestions, setImprovementSuggestions] = useState([
        "Add Portfolio Links to increase interview chances by 40%",
        "Update Skills Section: Add 'Machine Learning' - trending in 78% of job descriptions",
    ]);
    const [autoApplyThreshold, setAutoApplyThreshold] = useState(80);
    const [jobTypes, setJobTypes] = useState<Record<string, boolean>>({
        'Full-time': true,
        'Part-time': false,
        'Contract': false,
        'Remote': true,
    });
    const [minSalary, setMinSalary] = useState(60000);
    const [maxSalary, setMaxSalary] = useState(150000);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const [isLoadingSettings, setIsLoadingSettings] = useState(false);
    const [notifyMessage, setNotifyMessage] = useState<string | null>(null);
    const [filterLocation, setFilterLocation] = useState('');
    const [filterCompany, setFilterCompany] = useState('');
    const [filterJobType, setFilterJobType] = useState('');
    const [filterMinSalary, setFilterMinSalary] = useState('');
    const [filterMaxSalary, setFilterMaxSalary] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [savedJobs, setSavedJobs] = useState<any[]>(() => {
      const stored = localStorage.getItem('savedJobs');
      return stored ? JSON.parse(stored) : [];
    });
    useEffect(() => {
      localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
    }, [savedJobs]);
    const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
    const [notification, setNotification] = useState<string | null>(null);
    const [showJobModal, setShowJobModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<string>('');
    const [showUserSettings, setShowUserSettings] = useState(false);
    const [profilePic, setProfilePic] = useState(() => localStorage.getItem('profilePic') || '');
    const [jobAlertsEnabled, setJobAlertsEnabled] = useState(() => localStorage.getItem('jobAlertsEnabled') === 'true');
    useEffect(() => {
      localStorage.setItem('jobAlertsEnabled', jobAlertsEnabled ? 'true' : 'false');
    }, [jobAlertsEnabled]);
    const prevJobCount = useRef(0);
    const [resumes, setResumes] = useState<{name: string, text: string}[]>(() => {
      const stored = localStorage.getItem('resumes');
      return stored ? JSON.parse(stored) : [];
    });
    const [activeResumeIndex, setActiveResumeIndex] = useState(0);
    const [autoAppliedForJobs, setAutoAppliedForJobs] = useState<string | null>(null);
    const [contactSuccess, setContactSuccess] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    // Resume Convert states
    const [resumeConvertFile, setResumeConvertFile] = useState<File|null>(null);
    const [resumeConvertText, setResumeConvertText] = useState('');
    const [convertedResume, setConvertedResume] = useState('');
    const [coverLetter, setCoverLetter] = useState('');
    const [isConverting, setIsConverting] = useState(false);
    const [isGeneratingCover, setIsGeneratingCover] = useState(false);
    const resumeConvertInputRef = useRef<HTMLInputElement>(null);
    const handleResumeConvertFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setResumeConvertFile(file);
      setIsConverting(true);
      try {
        let text = '';
        if (file.type === 'text/plain') {
          const reader = new FileReader();
          text = await new Promise<string>((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsText(file);
          });
        } else if (file.type === 'application/pdf') {
          if (typeof (window as any).pdfjsLib === 'undefined') {
            setMessage('PDF.js library not loaded. Cannot process PDF files. Please try again or upload a .txt file.');
            setIsConverting(false);
            return;
          }
          const arrayBuffer = await new Promise<ArrayBuffer>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
            reader.readAsArrayBuffer(file);
          });
          const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item: any) => item.str).join(' ') + '\n';
          }
        } else {
          setMessage('Unsupported file type. Please upload a .txt or .pdf file.');
          setResumeConvertText('');
          setConvertedResume('');
          setIsConverting(false);
          return;
        }
        setResumeConvertText(text);
        setConvertedResume('');
      } catch (error: any) {
        setResumeConvertText('');
        setConvertedResume('');
        setMessage('Error processing file: ' + error.message);
      } finally {
        setIsConverting(false);
      }
    };
    const triggerResumeConvertUpload = () => { resumeConvertInputRef.current?.click(); };
    const handleConvertResume = async () => {
      if (!resumeConvertText || !selectedCompany) return;
      setIsConverting(true);
      try {
        const prompt = `Rewrite the following resume text to tailor it for a job application at ${selectedCompany}. Focus on relevant skills, experience, and keywords for this company. Output only the improved resume text.\n\nResume:\n${resumeConvertText}`;
        const payload = {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "text/plain"
          }
        };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`);
        }
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
        setConvertedResume(text);
      } catch (error: any) {
        setConvertedResume('Error converting resume: ' + error.message);
      } finally {
        setIsConverting(false);
      }
    };
    const handleGenerateCoverLetter = async () => {
      setIsGeneratingCover(true);
      try {
        const prompt = `Write a professional cover letter for a job application to ${selectedCompany}, based on the following resume:\n\n${resumeConvertText}`;
        const payload = {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "text/plain"
          }
        };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`);
        }
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
        setCoverLetter(text);
      } catch (error: any) {
        setCoverLetter('Error generating cover letter: ' + error.message);
      } finally {
        setIsGeneratingCover(false);
      }
    };

    // Filter and search logic
    const filteredJobs = generatedJobs.filter(job => {
      const matchesLocation = filterLocation ? (job.location || '').toLowerCase().includes(filterLocation.toLowerCase()) : true;
      const matchesCompany = filterCompany ? (job.company || '').toLowerCase().includes(filterCompany.toLowerCase()) : true;
      const matchesJobType = filterJobType ? (job.jobType || '').toLowerCase().includes(filterJobType.toLowerCase()) : true;
      const matchesMinSalary = filterMinSalary ? job.salary >= Number(filterMinSalary) : true;
      const matchesMaxSalary = filterMaxSalary ? job.salary <= Number(filterMaxSalary) : true;
      const matchesSearch = searchTerm ? ((job.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (job.description || '').toLowerCase().includes(searchTerm.toLowerCase())) : true;
      return matchesLocation && matchesCompany && matchesJobType && matchesMinSalary && matchesMaxSalary && matchesSearch;
    });

    // Notification logic: show when new jobs are found
    useEffect(() => {
      if (filteredJobs.length > 0) {
        setNotification(`Found ${filteredJobs.length} jobs matching your filters!`);
        setTimeout(() => setNotification(null), 3000);
      }
    }, [filteredJobs.length]);

    useEffect(() => {
      if (jobAlertsEnabled && filteredJobs.length > prevJobCount.current) {
        setNotification(`Job Alert: ${filteredJobs.length - prevJobCount.current} new job(s) found!`);
        setTimeout(() => setNotification(null), 4000);
      }
      prevJobCount.current = filteredJobs.length;
    }, [filteredJobs.length, jobAlertsEnabled]);

    useEffect(() => {
        localStorage.setItem('darkMode', 'false'); // No longer needed
    }, []);

    // Firebase Initialization and Authentication
    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.min.js";
        script.onload = () => {
            if ((window as any).pdfjsLib) {
                (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
            }
        };
        document.body.appendChild(script);
        // Supabase auth listener
        supabase.auth.getSession().then(({ data }: { data: { session: any } }) => {
            setUser(data.session?.user ?? null);
            setLoadingAuth(false);
        });
        const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
            setUser(session?.user ?? null);
            setLoadingAuth(false);
        });
        return () => {
            listener?.subscription.unsubscribe();
        };
    }, []);

    const loadUserData = async (userId: string) => {
        if (!userId) return;
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (error) throw error;
            if (data) {
                setResumeText(data.resume_text || '');
                setExtractedSkills(data.skills || []);
                setGeneratedJobs(data.jobs || []);
                setIsAutoApplied(data.is_auto_applied || false);
                setAppliedJobs(data.applied_jobs || []);
                setAppliedJobsCount(data.applied_jobs_count || 0);
                setInReviewJobsCount(data.in_review_jobs_count || 0);
                setInterviewScheduledCount(data.interview_scheduled_count || 0);
                setResponseRate(data.response_rate || 0);
                setSuccessScore(data.success_score || 0);
                setAppPerformance(data.app_performance || { responseRate: 0, interviewRate: 0, profileViews: 0 });
                setAutoApplyThreshold(data.auto_apply_threshold || 80);
                setJobTypes(data.job_types || { 'Full-time': true, 'Part-time': false, 'Contract': false, 'Remote': true });
                setMinSalary(data.min_salary || 60000);
                setMaxSalary(data.max_salary || 150000);
                setMessage('Your saved data has been loaded!');
            } else {
                setMessage('Welcome! Upload your resume to get started.');
                resetAllStates();
            }
        } catch (error: any) {
            setMessage(`Error loading your data: ${error.message}`);
        }
    };

    const saveUserData = async () => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('user_profiles')
                .upsert({
                    id: user.id,
                    resume_text: resumeText,
                    skills: extractedSkills,
                    jobs: generatedJobs,
                    is_auto_applied: isAutoApplied,
                    applied_jobs: appliedJobs,
                    applied_jobs_count: appliedJobsCount,
                    in_review_jobs_count: inReviewJobsCount,
                    interview_scheduled_count: interviewScheduledCount,
                    response_rate: responseRate,
                    success_score: successScore,
                    app_performance: appPerformance,
                    auto_apply_threshold: autoApplyThreshold,
                    job_types: jobTypes,
                    min_salary: minSalary,
                    max_salary: maxSalary,
                    last_updated: new Date().toISOString(),
                });
            if (error) throw error;
        } catch (error: any) {
            setMessage(`Error saving your data: ${error.message}`);
        }
    };

    useEffect(() => {
        if (!loadingAuth && user) {
            saveUserData();
        }
    }, [
        resumeText, extractedSkills, generatedJobs, isAutoApplied,
        appliedJobs, appliedJobsCount, inReviewJobsCount, interviewScheduledCount, responseRate,
        successScore, appPerformance,
        autoApplyThreshold, jobTypes, minSalary, maxSalary,
        loadingAuth, user
    ]);

    const resetAllStates = () => {
        setResumeText('');
        setExtractedSkills([]);
        setGeneratedJobs([]);
        setIsLoadingSkills(false);
        setIsLoadingJobs(false);
        setMessage('');
        setIsAutoApplied(false);
        setAppliedJobs([]); // Reset applied jobs
        setAppliedJobsCount(0);
        setInReviewJobsCount(0);
        setInterviewScheduledCount(0);
        setResponseRate(0);
        setSuccessScore(0);
        setAppPerformance({ responseRate: 0, interviewRate: 0, profileViews: 0 });
    };

    // Update handleFileChange to support multi-resume
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            setMessage('No file selected.');
            return;
        }
        setMessage('');
        setIsLoadingSkills(true);
        setExtractedSkills([]);
        setGeneratedJobs([]);
        setIsAutoApplied(false);
        resetApplicationStatus();
        try {
            let text = '';
            if (file.type === 'text/plain') {
                const reader = new FileReader();
                text = await new Promise<string>((resolve) => {
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsText(file);
                });
            } else if (file.type === 'application/pdf') {
                if (typeof (window as any).pdfjsLib === 'undefined') {
                    setMessage('PDF.js library not loaded. Cannot process PDF files. Please try again or upload a .txt file.');
                    setIsLoadingSkills(false);
                    return;
                }
                const arrayBuffer = await new Promise<ArrayBuffer>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
                    reader.readAsArrayBuffer(file);
                });
                const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map((item: any) => item.str).join(' ') + '\n';
                }
            } else {
                setMessage('Unsupported file type. Please upload a .txt or .pdf file.');
                setResumeText('');
                setExtractedSkills([]);
                setGeneratedJobs([]);
                setIsAutoApplied(false);
                setIsLoadingSkills(false);
                return;
            }
            setResumeText(text);
        setResumes(prev => {
          const newResumes = [...prev, { name: file.name, text }];
          localStorage.setItem('resumes', JSON.stringify(newResumes));
          setActiveResumeIndex(newResumes.length - 1);
          return newResumes;
        });
            // This is the crucial call: After resume is parsed, extract skills and then generate/apply jobs.
            await parseResume(text);
        } catch (error: any) {
            setMessage(`Error processing file: ${error.message}. Please ensure the PDF is not encrypted or corrupted.`);
            setIsLoadingSkills(false);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const parseResume = async (textToParse: string) => {
        if (!textToParse.trim()) {
            setMessage('Resume text is empty. Please upload a valid resume file.');
            setIsLoadingSkills(false);
            return;
        }
        setMessage('');
        setIsLoadingSkills(true);
        setExtractedSkills([]);
        setGeneratedJobs([]);
        setIsAutoApplied(false);
        try {
            const prompt = `Extract the key skills, programming languages, tools, and areas of expertise from the following resume text. Provide the output as a JSON array of strings, where each string is a distinct skill or area of expertise. Do not include personal information like name, contact details, or specific company names. Focus solely on technical and professional skills.\n\nResume:\n${textToParse}`;
            let chatHistory: any[] = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });
            const payload = {
                contents: chatHistory,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "ARRAY",
                        items: {
                            type: "STRING"
                        }
                    }
                }
            };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.error.message}`);
            }
            const result = await response.json();
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const json = result.candidates[0].content.parts[0].text;
                const parsedSkills = JSON.parse(json);
                setExtractedSkills(parsedSkills);
                setMessage('Skills extracted successfully! Now generating job suggestions.');
                // Call generateJobs, which will then call simulateAutoApply
                generateJobs(parsedSkills);
            } else {
                setMessage('Failed to extract skills. Please try again.');
            }
        } catch (error: any) {
            setMessage(`Error parsing resume: ${error.message}. Please ensure your resume text is clear.`);
        } finally {
            setIsLoadingSkills(false);
        }
    };

    const demoJobs = [
      {
        id: 'demo1',
        title: 'Frontend Developer Intern',
        company: 'DemoTech',
        description: 'Work with React and TypeScript to build modern UIs.',
        jobType: 'Internship',
        isRemote: true,
        salary: 20000,
        status: 'Applied',
        matchScore: 95,
        appliedDaysAgo: 0,
        interviewScheduled: false,
        interviewTime: null,
        link: 'https://example.com/job/frontend-intern',
        source: 'Demo'
      },
      {
        id: 'demo2',
        title: 'Backend Engineer',
        company: 'DemoSoft',
        description: 'Develop scalable APIs with Node.js.',
        jobType: 'Full-time',
        isRemote: false,
        salary: 80000,
        status: 'Applied',
        matchScore: 90,
        appliedDaysAgo: 0,
        interviewScheduled: false,
        interviewTime: null,
        link: 'https://example.com/job/backend-engineer',
        source: 'Demo'
      }
      // ...add more demo jobs as desired
    ];

    const generateJobs = async (skills: string[]) => {
        if (skills.length === 0) {
            setMessage('No skills extracted to generate jobs. Please upload a resume with skills first.');
            setIsLoadingJobs(false);
            return;
        }
        setIsLoadingJobs(true);
        setGeneratedJobs([]);
        try {
            const response = await fetch('http://localhost:3000/scraper/find-jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keywords: skills })
            });
            if (!response.ok) {
                const errorData = await response.json();
                showToast(`API error: ${response.status} ${response.statusText} - ${errorData.error}`, 'error');
                throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.error}`);
            }
            const result = await response.json();
            if (result.jobs && result.jobs.length > 0) {
                const jobsWithUI = result.jobs.map((job: any) => ({
                    ...job,
                    id: Math.random().toString(36).substring(2, 9),
                    description: job.description || '',
                    jobType: job.jobType || 'Full-time',
                    isRemote: job.isRemote || false,
                    salary: job.salary || 0,
                    status: 'Applied',
                    matchScore: Math.floor(Math.random() * 21) + 80, // 80-100
                    appliedDaysAgo: Math.floor(Math.random() * 7) + 1,
                    interviewScheduled: Math.random() < 0.3,
                    interviewTime: Math.random() < 0.3 ? `Tomorrow at ${Math.floor(Math.random() * 4) + 10}:00 AM` : null
                }));
                setGeneratedJobs(jobsWithUI);
                console.log('setGeneratedJobs (real jobs):', jobsWithUI);
                // Directly call simulateAutoApply here after jobs are generated
                simulateAutoApply(jobsWithUI);
                setMessage('Jobs scraped and suggestions generated successfully!');
                showToast('Jobs found and suggestions generated! Auto-applying now.', 'success');
                setCurrentPage('application-status'); // Navigate to application status
            } else {
                setGeneratedJobs(demoJobs);
                console.log('setGeneratedJobs (demo jobs):', demoJobs);
                // Directly call simulateAutoApply here even for demo jobs
                simulateAutoApply(demoJobs);
                setMessage('No jobs found for the extracted skills. Showing demo jobs.');
                showToast('No jobs found for your skills. Showing demo jobs. Auto-applying now.', 'info');
                setCurrentPage('application-status'); // Navigate to application status
            }
        } catch (error: any) {
            setMessage(`Error generating jobs: ${error.message}. Please try again.`);
            setGeneratedJobs(demoJobs);
            console.log('generateJobs error:', error);
            showToast(`Error generating jobs: ${error.message}`, 'error');
            // Even on error, show demo jobs and simulate apply
            simulateAutoApply(demoJobs);
            setCurrentPage('application-status');
        } finally {
            setIsLoadingJobs(false);
        }
    };

    // This useEffect is now primarily for re-triggering simulateAutoApply if generatedJobs changes
    // for reasons other than the initial parsing/generation, and to prevent re-applying to the same set.
    useEffect(() => {
      // Only run if there are generated jobs and they haven't been auto-applied yet
      // This prevents infinite loops if generatedJobs changes for other reasons
      if (generatedJobs.length > 0 && !isAutoApplied) {
        simulateAutoApply(generatedJobs);
      }
    }, [generatedJobs, isAutoApplied]);


    // Resume Analyzer logic
    function getResumeAnalysis(skills: string[], resumeText: string) {
      const wordCount = resumeText.split(/\s+/).length;
      const skillCount = skills.length;
      const density = wordCount ? ((skillCount / wordCount) * 100).toFixed(2) : '0';
      const suggestions = [];
      if (!skills.includes('Machine Learning')) suggestions.push("Consider adding 'Machine Learning' if relevant.");
      if (!skills.includes('Cloud')) suggestions.push("Highlight any cloud experience (AWS, Azure, GCP).");
      if (skillCount < 5) suggestions.push('Add more technical or soft skills to strengthen your resume.');
      return { skillCount, density, suggestions };
    }

    // Update simulateAutoApply to track applied jobs
    const simulateAutoApply = (jobsToApply?: any[]) => {
        console.log("Simulate auto apply called", jobsToApply || generatedJobs);
        const jobs = jobsToApply || generatedJobs;
        if (jobs.length === 0) {
            setMessage('No jobs to apply to. Please upload your resume first and ensure settings allow jobs to be generated.');
            return;
        }
        let applied = 0;
        let inReview = 0;
        let interviews = 0;
        const updatedJobs = jobs.map((job) => {
            applied++;
            let status = 'Applied';
            if (job.interviewScheduled) {
                interviews++;
                status = 'Interview Scheduled';
            } else if (Math.random() < 0.5) {
                inReview++;
                status = 'Under Review';
            }
            const appliedJob = { ...job, status };
            return appliedJob;
        });
        setGeneratedJobs(updatedJobs);
        setAppliedJobs(updatedJobs);
        console.log('setAppliedJobs:', updatedJobs);
        setAppliedJobsCount(applied);
        setInReviewJobsCount(inReview);
        setInterviewScheduledCount(interviews);
        setResponseRate(Math.floor((inReview + interviews) / applied * 100));
        setSuccessScore(Number((Math.random() * 2 + 7).toFixed(1)));
        setAppPerformance({
            responseRate: Math.floor(Math.random() * 20) + 70,
            interviewRate: Math.floor(Math.random() * 30) + 40,
            profileViews: Math.floor(Math.random() * 10) + 90,
        });
        setMessage(`Successfully "auto-applied" to ${applied} jobs/internships! (This is a simulation and does not interact with real job boards.)`);
        setIsAutoApplied(true);
        showToast(`Auto-applied to ${applied} jobs/internships!`, 'success');
        // This is important: After auto-apply, direct the user to the application status
        setCurrentPage('application-status');
    };

    const resetApplicationStatus = () => {
        setAppliedJobsCount(0);
        setInReviewJobsCount(0);
        setInterviewScheduledCount(0);
        setResponseRate(0);
        setSuccessScore(0);
        setAppPerformance({ responseRate: 0, interviewRate: 0, profileViews: 0 });
    };

    const handleLogout = async () => {
            try {
            await supabase.auth.signOut();
            setUser(null);
                resetAllStates();
                setMessage('You have been logged out. Please sign in again.');
                setCurrentPage('home');
            } catch (error: any) {
                setMessage(`Error logging out: ${error.message}`);
        }
    };

    // Add sign-in handlers
    const handleGoogleSignIn = async () => {
        setAuthError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
            if (error) throw error;
        } catch (error: any) {
            setAuthError(error.message || 'Google sign-in failed');
        }
    };

    const handleEmailSignIn = async (email: string, password: string) => {
        setAuthError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } catch (error: any) {
            setAuthError(error.message || 'Email sign-in failed');
        }
    };

    const handleEmailSignUp = async (email: string, password: string) => {
        setAuthError(null);
        try {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
        } catch (error: any) {
            setAuthError(error.message || 'Email sign-up failed');
        }
    };

    const handleAutoApplySettingsSubmit = async () => {
        setIsLoadingSettings(true);
        setMessage('');
        if (!user) {
            setMessage('Unable to save settings: Not signed in or database unavailable.');
            setIsLoadingSettings(false);
            return;
        }
        try {
            const { error } = await supabase
                .from('user_profiles')
                .upsert({
                    id: user.id,
                    auto_apply_threshold: autoApplyThreshold,
                    job_types: jobTypes,
                    min_salary: minSalary,
                    max_salary: maxSalary,
                    last_updated: new Date().toISOString(),
                });
            if (error) throw error;
            setMessage('Auto-Apply settings saved!');
        } catch (error: any) {
            setMessage('Failed to save settings: ' + (error.message || error));
        } finally {
            setIsLoadingSettings(false);
        }
    };

    const handleNotify = async () => {
        setNotifyMessage(null);
        try {
            const res = await fetch('http://localhost:3000/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id }),
            });
            const data = await res.json();
            setNotifyMessage(data.message || 'Notification triggered!');
        } catch (err) {
            setNotifyMessage('Failed to trigger notification.');
        }
    };

    // Job details modal logic
    const handleJobClick = (job: any) => {
      setSelectedJob(job);
      setShowJobModal(true);
    };
    // Company profile modal logic
    const handleCompanyClick = (company: string) => {
      setSelectedCompany(company);
      setShowCompanyModal(true);
    };

    // Animated loading skeleton for job cards
    const JobSkeleton = () => (
      <div className="bg-gray-200 animate-pulse rounded-lg p-6 mb-4 w-full">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
      </div>
    );

    // Company list from job results
    const companyList = Array.from(new Set(filteredJobs.map(j => j.company))).filter(Boolean);

    // Add job sharing and feedback/support modal features
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');

    // Chart Data for Dashboard
    const applicationTrends = Array.from({ length: 6 }, (_, i) => {
      // Simulate last 6 months
      const month = new Date();
      month.setMonth(month.getMonth() - (5 - i));
      const label = month.toLocaleString('default', { month: 'short' });
      const count = appliedJobs.filter(job => {
        // Simulate job.appliedDate as days ago
        const daysAgo = job.appliedDaysAgo || 0;
        const appliedDate = new Date();
        appliedDate.setDate(appliedDate.getDate() - daysAgo);
        return appliedDate.getMonth() === month.getMonth();
      }).length;
      return { month: label, Applications: count };
    });
    const interviewRateData = [
      { name: 'Interview Scheduled', value: appliedJobs.filter(j => j.status === 'Interview Scheduled').length },
      { name: 'Under Review', value: appliedJobs.filter(j => j.status === 'Under Review').length },
      { name: 'Applied', value: appliedJobs.filter(j => j.status === 'Applied').length },
    ];
    const COLORS = ['#10b981', '#f59e42', '#3b82f6']; // Define colors for PieChart cells
    const calendarEvents = appliedJobs.map(job => {
      const daysAgo = job.appliedDaysAgo || 0;
      const appliedDate = new Date();
      appliedDate.setDate(appliedDate.getDate() - daysAgo);
      return { date: appliedDate, job };
    });
    // Toast notification helper
    const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
      if (type === 'success') toast.success(msg);
      else if (type === 'error') toast.error(msg);
      else toast.info(msg);
    };

    // Add the following state and handlers for ATS
    const [atsScore, setAtsScore] = useState<number|null>(null);
    const [atsBreakdown, setAtsBreakdown] = useState<{skillsMatch:number, formatting:number, keywords:number}>({skillsMatch:0, formatting:0, keywords:0});
    const [isLoadingAts, setIsLoadingAts] = useState(false);
    const atsFileInputRef = useRef<HTMLInputElement>(null);
    const handleAtsFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setIsLoadingAts(true);
      setAtsScore(null);
      // Simulate ATS scoring
      setTimeout(() => {
        const score = Math.floor(Math.random()*41)+60;
        setAtsScore(score);
        setAtsBreakdown({
          skillsMatch: Math.floor(Math.random()*41)+60,
          formatting: Math.floor(Math.random()*41)+60,
          keywords: Math.floor(Math.random()*41)+60
        });
        setIsLoadingAts(false);
      }, 1200);
    };
    const triggerAtsFileUpload = () => { atsFileInputRef.current?.click(); }

    if (loadingAuth) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="flex items-center text-gray-700 text-xl">
                    <svg className="animate-spin h-8 w-8 mr-3 text-blue-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading Application...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-white font-sans flex flex-col items-stretch justify-stretch">
            {/* Navigation Bar */}
            <nav className="w-full flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-blue-700">SmartApply</span>
                </div>
                <div className="flex gap-8 items-center">
                    <button className="text-gray-700 font-semibold hover:text-blue-600" onClick={() => setCurrentPage('home')}>Home</button>
                    <button className="text-gray-700 font-semibold hover:text-blue-600" onClick={() => setCurrentPage('dashboard')}>Dashboard</button>
                    <button className="text-gray-700 font-semibold hover:text-blue-600" onClick={() => setCurrentPage('application-status')}>Application Status</button>
                    <button className="text-gray-700 font-semibold hover:text-blue-600" onClick={() => setCurrentPage('ats')}>ATS</button>
                    <button className="text-gray-700 font-semibold hover:text-blue-600" onClick={() => setCurrentPage('resume-convert')}>Resume Convert</button>
                </div>
                <div className="flex gap-4 items-center">
                    {user ? (
                        <>
                            <span className="text-gray-700">{user.email || 'User'}</span>
                            <button className="bg-red-500 text-white px-4 py-2 rounded font-semibold hover:bg-red-600 transition" onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        <>
                            {/* These buttons will open the AuthForm modal */}
                            <button className="text-blue-700 font-semibold hover:underline" onClick={() => { setShowAuthModal(true); setAuthMode('login'); }}>Login</button>
                            <button className="bg-blue-500 text-white px-4 py-2 rounded font-semibold hover:bg-blue-600 transition" onClick={() => { setShowAuthModal(true); setAuthMode('signup'); }}>Sign Up</button>
                        </>
                    )}
                </div>
            </nav>

            {/* Main Content Area based on currentPage */}
            {currentPage === 'dashboard' ? (
                <main className="flex-1 flex flex-col items-center w-full px-4 py-12 bg-gradient-to-br from-blue-50 to-white">
                    <div className="w-full max-w-5xl mx-auto">
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
                            <span>Dashboard</span>
                            <span className="text-base bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">Beta</span>
                        </h1>
                        {/* Stats Cards */}
                        <ApplicationStatusDashboard
                            appliedJobsCount={appliedJobsCount}
                            inReviewJobsCount={inReviewJobsCount}
                            interviewScheduledCount={interviewScheduledCount}
                            responseRate={responseRate}
                        />
                        {/* Charts Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 mb-8">
                            <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
                                <h3 className="text-lg font-bold mb-4 text-gray-800">Applications Over Time</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={applicationTrends}>
                                        <XAxis dataKey="month" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Bar dataKey="Applications" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
                                <h3 className="text-lg font-bold mb-4 text-gray-800">Interview Rate</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={interviewRateData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                                            {interviewRateData.map((entry, idx) => (
                                                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Legend />
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        {/* Calendar */}
                        <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-100">
                            <h3 className="text-lg font-bold mb-4 text-gray-800">Application & Interview Calendar</h3>
                            <Calendar
                                tileContent={({ date, view }) => {
                                    if (view === 'month') {
                                        const event = calendarEvents.find(e => e.date.toDateString() === date.toDateString());
                                        if (event) {
                                            return <span className="block w-2 h-2 bg-blue-500 rounded-full mx-auto mt-1"></span>;
                                        }
                                    }
                                    return null;
                                }}
                            />
                            <div className="mt-2 text-sm text-gray-500">Blue dots indicate application/interview dates.</div>
                        </div>
                        {/* Recent Applications */}
                        <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-100">
                            <h2 className="text-xl font-bold mb-4 text-gray-800">Recent Applications</h2>
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-gray-600 border-b">
                                        <th className="py-2">Job Title</th>
                                        <th className="py-2">Company</th>
                                        <th className="py-2">Status</th>
                                        <th className="py-2">Applied</th>
                                        <th className="py-2">Interview</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appliedJobs.slice(0, 5).map((job, idx) => (
                                        <tr key={job.id || idx} className="border-b last:border-0">
                                            <td className="py-2 font-semibold">{job.title}</td>
                                            <td className="py-2">{job.company}</td>
                                            <td className="py-2">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${job.status === 'Interview Scheduled' ? 'bg-green-100 text-green-700' : job.status === 'Under Review' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{job.status}</span>
                                            </td>
                                            <td className="py-2">{job.appliedDaysAgo ? `${job.appliedDaysAgo}d ago` : 'Today'}</td>
                                            <td className="py-2">{job.interviewScheduled ? job.interviewTime || 'Scheduled' : '-'}</td>
                                        </tr>
                                    ))}
                                    {appliedJobs.length === 0 && (
                                        <tr><td colSpan={5} className="text-center text-gray-400 py-4">No applications yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Resume Analysis */}
                        <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-100">
                            <h2 className="text-xl font-bold mb-4 text-gray-800">Resume Analysis</h2>
                            <div className="flex flex-col sm:flex-row gap-8">
                                <div className="flex-1">
                                    <p className="text-gray-600 mb-2">Skills Extracted: <span className="font-bold text-blue-700">{extractedSkills.length}</span></p>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {extractedSkills.map((skill, idx) => (
                                            <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">{skill}</span>
                                        ))}
                                        {extractedSkills.length === 0 && <span className="text-gray-400">No skills extracted yet.</span>}
                                    </div>
                                    <p className="text-gray-600">Skill Density: <span className="font-bold">{getResumeAnalysis(extractedSkills, resumeText).density}%</span></p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-600 mb-2 font-semibold">Suggestions:</p>
                                    <ul className="list-disc list-inside text-gray-500">
                                        {getResumeAnalysis(extractedSkills, resumeText).suggestions.map((s, i) => (
                                            <li key={i}>{s}</li>
                                        ))}
                                        {getResumeAnalysis(extractedSkills, resumeText).suggestions.length === 0 && <li>No suggestions yet.</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>
                        {/* Insights & Improvements */}
                        <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-100">
                            <h2 className="text-xl font-bold mb-4 text-gray-800">Insights & Improvements</h2>
                            <ul className="list-disc list-inside text-gray-600">
                                {improvementSuggestions.map((s, i) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ul>
                        </div>
                        {/* Quick Links */}
                        <div className="flex flex-wrap gap-4 mt-4">
                            <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded font-semibold hover:bg-blue-200 transition" onClick={() => setCurrentPage('home')}>Go to Home</button>
                            <button className="bg-green-100 text-green-700 px-4 py-2 rounded font-semibold hover:bg-green-200 transition" onClick={triggerFileUpload}>Upload Resume</button>
                            <button className="bg-purple-100 text-purple-700 px-4 py-2 rounded font-semibold hover:bg-purple-200 transition" onClick={() => setShowUserSettings(true)}>User Settings</button>
                            <button className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded font-semibold hover:bg-yellow-200 transition" onClick={() => exportJobsToCSV(appliedJobs, 'applications.csv')}>Export Applications</button>
                        </div>
                    </div>
                </main>
            ) : currentPage === 'application-status' ? (
                <main className="flex-1 flex flex-col items-center w-full px-4 py-12 bg-gradient-to-br from-blue-50 to-white">
                    <div className="w-full max-w-4xl mx-auto">
                        <button className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-semibold" onClick={() => setCurrentPage('home')}>← Back to Home</button>
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Application Status</h1>
                        {/* Applied Jobs Section */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-blue-700 mb-4 flex items-center gap-2"><svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-8 0v2"/><circle cx="12" cy="7" r="4"/></svg>Applied Jobs</h2>
                            {appliedJobs.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {appliedJobs.map((job, idx) => (
                                        <div key={idx} className="bg-white border border-gray-100 rounded-lg shadow p-4 flex flex-col transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:border-blue-400">
                                            <div className="font-bold text-lg text-gray-800 mb-1">{job.title}</div>
                                            <div className="text-gray-500 text-sm mb-1">{job.company}</div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">{job.jobType || 'Full-time'}</span>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${job.status === 'Interview Scheduled' ? 'bg-green-100 text-green-700' : job.status === 'Under Review' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{job.status}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-400 mb-1">
                                                <span>Applied {job.appliedDaysAgo ? `${job.appliedDaysAgo}d ago` : 'Today'}</span>
                                                {job.location && <span className="text-gray-500">{job.location}</span>}
                                                {job.salary && <span className="text-green-600 font-semibold">₹{job.salary.toLocaleString()}</span>}
                                            </div>
                                            {job.interviewScheduled && <div className="text-xs text-green-600 font-semibold">Interview: {job.interviewTime || 'Scheduled'}</div>}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-400">No jobs applied yet.</div>
                            )}
                        </section>
                        {/* Simulated Jobs Section */}
                        <section>
                            <h2 className="text-2xl font-bold text-purple-700 mb-4 flex items-center gap-2"><svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>Simulated Jobs</h2>
                            {generatedJobs.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {generatedJobs.map((job, idx) => (
                                        <div key={idx} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg shadow p-4 flex flex-col transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:border-purple-400">
                                            <div className="font-bold text-lg text-blue-800 mb-1">{job.title}</div>
                                            <div className="text-gray-500 text-sm mb-1">{job.company}</div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">{job.jobType || 'Full-time'}</span>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${job.status === 'Interview Scheduled' ? 'bg-green-100 text-green-700' : job.status === 'Under Review' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{job.status}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-400 mb-1">
                                                {job.location && <span className="text-gray-500">{job.location}</span>}
                                                {job.salary && <span className="text-green-600 font-semibold">₹{job.salary.toLocaleString()}</span>}
                                            </div>
                                            <div className="text-xs text-gray-400 mb-1">Simulated Match Score: <span className="font-bold text-blue-700">{job.matchScore || '--'}%</span></div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-400">No simulated jobs available.</div>
                            )}
                        </section>
                    </div>
                </main>
            ) : currentPage === 'ats' ? (
                <main className="flex-1 flex flex-col items-center w-full px-4 py-12 bg-gradient-to-br from-blue-50 to-white">
                    <div className="w-full max-w-xl mx-auto">
                        <button className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-semibold" onClick={() => setCurrentPage('home')}>← Back to Home</button>
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">ATS Resume Checker</h1>
                        <div className="bg-white rounded-lg shadow p-8 border border-gray-100 flex flex-col items-center">
                            <label className="text-lg font-semibold mb-2">Upload your resume (PDF/TXT):</label>
                            <input
                                type="file"
                                accept=".pdf,.txt"
                                onChange={handleAtsFileChange}
                                className="mb-4 border border-gray-300 rounded px-4 py-2 w-full max-w-xs"
                            />
                            <button
                                className="w-full max-w-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                                onClick={triggerAtsFileUpload}
                                disabled={isLoadingAts}
                            >
                                {isLoadingAts ? 'Uploading & Checking...' : 'Upload & Check ATS Score'}
                            </button>
                        </div>
                        {atsScore !== null && (
                            <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg p-6 flex flex-col items-center border border-green-100">
                                <h2 className="text-2xl font-bold text-green-700 mb-2">ATS Score: <span className="text-3xl">{atsScore}%</span></h2>
                                <div className="w-full flex flex-col sm:flex-row gap-6 mt-4">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-700 mb-1">Skills Match</h3>
                                        <div className="h-3 w-full bg-gray-200 rounded-full mb-2">
                                            <div className="h-3 bg-green-400 rounded-full" style={{ width: `${atsBreakdown.skillsMatch}%` }}></div>
                                        </div>
                                        <span className="text-xs text-gray-500">{atsBreakdown.skillsMatch}% match</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-700 mb-1">Formatting</h3>
                                        <div className="h-3 w-full bg-gray-200 rounded-full mb-2">
                                            <div className="h-3 bg-blue-400 rounded-full" style={{ width: `${atsBreakdown.formatting}%` }}></div>
                                        </div>
                                        <span className="text-xs text-gray-500">{atsBreakdown.formatting}% formatting</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-700 mb-1">Keywords</h3>
                                        <div className="h-3 w-full bg-gray-200 rounded-full mb-2">
                                            <div className="h-3 bg-purple-400 rounded-full" style={{ width: `${atsBreakdown.keywords}%` }}></div>
                                        </div>
                                        <span className="text-xs text-gray-500">{atsBreakdown.keywords}% keywords</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            ) : currentPage === 'resume-convert' ? (
                <main className="flex-1 flex flex-col items-center w-full px-4 py-12 bg-gradient-to-br from-blue-50 to-white">
                    <div className="w-full max-w-2xl mx-auto">
                        <button className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-semibold" onClick={() => setCurrentPage('home')}>← Back to Home</button>
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Resume Convert & Cover Letter</h1>
                        <div className="bg-white rounded-lg shadow p-8 border border-gray-100 flex flex-col items-center mb-8">
                            <label className="text-lg font-semibold mb-2">Upload your resume (PDF/TXT):</label>
                            <input
                                type="file"
                                accept=".pdf,.txt"
                                onChange={handleResumeConvertFileChange}
                                ref={resumeConvertInputRef}
                                className="mb-4 border border-gray-300 rounded px-4 py-2 w-full max-w-xs"
                            />
                            <button
                                className="w-full max-w-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                                onClick={triggerResumeConvertUpload}
                                disabled={isConverting}
                            >
                                {isConverting ? 'Uploading...' : 'Upload Resume'}
                            </button>
                            <select
                                className="mt-4 mb-2 border border-gray-300 rounded px-4 py-2 w-full max-w-xs"
                                value={selectedCompany || ''}
                                onChange={e => setSelectedCompany(e.target.value)}
                            >
                                <option value="">Select Company</option>
                                <option value="Google">Google</option>
                                <option value="Microsoft">Microsoft</option>
                                <option value="Amazon">Amazon</option>
                                <option value="Meta">Meta</option>
                                <option value="TCS">TCS</option>
                                <option value="Infosys">Infosys</option>
                            </select>
                            <button
                                className="w-full max-w-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition mt-2"
                                onClick={handleConvertResume}
                                disabled={isConverting || !resumeConvertText || !selectedCompany}
                            >
                                {isConverting ? 'Converting...' : 'Convert Resume'}
                            </button>
                        </div>
                        {convertedResume && (
                            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl shadow-lg p-6 mb-8 border border-blue-100">
                                <h2 className="text-xl font-bold text-blue-700 mb-2">Converted Resume (Simulated)</h2>
                                <pre className="whitespace-pre-wrap text-gray-700 text-sm bg-white rounded p-4 border border-gray-100 overflow-x-auto">{convertedResume}</pre>
                            </div>
                        )}
                        {/* Cover Letter Section */}
                        <div className="bg-white rounded-lg shadow p-8 border border-gray-100 flex flex-col items-center">
                            <h2 className="text-xl font-bold text-purple-700 mb-2">Cover Letter</h2>
                            <textarea
                                className="w-full border border-gray-300 rounded px-4 py-2 mb-2 min-h-[100px]"
                                value={coverLetter}
                                onChange={e => setCoverLetter(e.target.value)}
                                placeholder="Write or generate your cover letter..."
                            />
                            <button
                                className="w-full max-w-xs bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition mt-2"
                                onClick={handleGenerateCoverLetter}
                                disabled={isGeneratingCover || !selectedCompany}
                            >
                                {isGeneratingCover ? 'Generating...' : 'Generate Cover Letter'}
                            </button>
                        </div>
                    </div>
                </main>
            ) : (
                <main className="flex-1 flex flex-col items-center justify-center w-full px-4 py-12">
                    <div className="flex flex-col items-center w-full max-w-2xl mx-auto animate-fadeIn duration-700">
                        <span className="mb-6 px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-semibold text-sm border border-blue-200 animate-bounce" style={{ animationDelay: '0.5s' }}>AI-Powered Job Application Platform</span>
                        <h1 className="text-5xl sm:text-6xl font-extrabold text-center text-gray-900 mb-4 leading-tight animate-slideUp" style={{ animationDelay: '0.7s' }}>
                            Land Your Dream Job with <span className="text-blue-500">AI Automation</span>
                        </h1>
                        <p className="text-lg text-gray-600 text-center mb-8 max-w-xl animate-fadeIn" style={{ animationDelay: '0.9s' }}>
                            Upload your resume, let our AI find perfect job matches, and automatically apply to hundreds of positions while you focus on what matters most.
                        </p>
                        <div className="w-full flex flex-col items-center bg-white rounded-lg shadow p-8 border border-gray-100 animate-fadeIn" style={{ animationDelay: '1.1s' }}>
                            <label className="text-lg font-semibold mb-2">Upload your resume (PDF/DOCX):</label>
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={handleFileChange}
                                className="mb-4 border border-gray-300 rounded px-4 py-2 w-full max-w-xs"
                            />
                            <button
                                className="w-full max-w-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                                onClick={triggerFileUpload}
                                disabled={isLoadingSkills}
                            >
                                {isLoadingSkills ? 'Uploading & Parsing...' : 'Upload & Auto-Apply'}
                            </button>
                        </div>
                    </div>

                    {/* How It Works Section */}
                    <section className="w-full max-w-4xl mx-auto mt-16 mb-12 animate-fadeIn" style={{ animationDelay: '1.3s' }}>
                        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">How It Works</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-8">
                            <div className="flex flex-col items-center">
                                <div className="bg-blue-100 text-blue-600 rounded-full p-4 mb-2"><svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg></div>
                                <span className="font-semibold">1. Upload Resume</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="bg-green-100 text-green-600 rounded-full p-4 mb-2"><svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg></div>
                                <span className="font-semibold">2. AI Extracts Skills</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="bg-yellow-100 text-yellow-600 rounded-full p-4 mb-2"><svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 11h8M8 15h6"/></svg></div>
                                <span className="font-semibold">3. Find Jobs</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="bg-purple-100 text-purple-600 rounded-full p-4 mb-2"><svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-8 0v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                                <span className="font-semibold">4. Auto-Apply</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="bg-pink-100 text-pink-600 rounded-full p-4 mb-2"><svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="13" width="18" height="8" rx="2"/><path d="M16 3.13a4 4 0 010 7.75"/></svg></div>
                                <span className="font-semibold">5. Track Progress</span>
                            </div>
                        </div>
                    </section>

                    {/* Features Section */}
                    <section id="features" className="w-full max-w-5xl mx-auto mb-16 animate-fadeIn" style={{ animationDelay: '1.5s' }}>
                        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Features</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                            <div className="bg-white border border-gray-100 rounded-lg p-6 flex flex-col items-center shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:border-blue-400">
                                <div className="bg-blue-100 text-blue-600 rounded-full p-3 mb-2"><svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg></div>
                                <span className="font-semibold mb-1">Auto-Apply to Jobs</span>
                                <span className="text-gray-500 text-sm text-center">Automatically apply to jobs and internships that match your skills.</span>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-lg p-6 flex flex-col items-center shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:border-green-400">
                                <div className="bg-green-100 text-green-600 rounded-full p-3 mb-2"><svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg></div>
                                <span className="font-semibold mb-1">Resume Analyzer</span>
                                <span className="text-gray-500 text-sm text-center">Get instant feedback and suggestions to improve your resume.</span>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-lg p-6 flex flex-col items-center shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:border-yellow-400">
                                <div className="bg-yellow-100 text-yellow-600 rounded-full p-3 mb-2"><svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 11h8M8 15h6"/></svg></div>
                                <span className="font-semibold mb-1">Application Tracker</span>
                                <span className="text-gray-500 text-sm text-center">Track all your job applications and their statuses in one place.</span>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-lg p-6 flex flex-col items-center shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:border-purple-400">
                                <div className="bg-purple-100 text-purple-600 rounded-full p-3 mb-2"><svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-8 0v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                                <span className="font-semibold mb-1">Notifications & Alerts</span>
                                <span className="text-gray-500 text-sm text-center">Get notified about new jobs, application status, and interviews.</span>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-lg p-6 flex flex-col items-center shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:border-pink-400">
                                <div className="bg-pink-100 text-pink-600 rounded-full p-3 mb-2"><svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="13" width="18" height="8" rx="2"/><path d="M16 3.13a4 4 0 010 7.75"/></svg></div>
                                <span className="font-semibold mb-1">Export & Download</span>
                                <span className="text-gray-500 text-sm text-center">Export your job list, applications, and resume analysis to CSV.</span>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-lg p-6 flex flex-col items-center shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:border-blue-400">
                                <div className="bg-blue-100 text-blue-600 rounded-full p-3 mb-2"><svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg></div>
                                <span className="font-semibold mb-1">Multi-Resume Support</span>
                                <span className="text-gray-500 text-sm text-center">Upload and manage multiple resumes for different job types.</span>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-lg p-6 flex flex-col items-center shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:border-green-400">
                                <div className="bg-green-100 text-green-600 rounded-full p-3 mb-2"><svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg></div>
                                <span className="font-semibold mb-1">Company Profiles</span>
                                <span className="text-gray-500 text-sm text-center">View company info and all open jobs from each employer.</span>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-lg p-6 flex flex-col items-center shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:border-yellow-400">
                                <div className="bg-yellow-100 text-yellow-600 rounded-full p-3 mb-2"><svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 11h8M8 15h6"/></svg></div>
                                <span className="font-semibold mb-1">Application Calendar</span>
                                <span className="text-gray-500 text-sm text-center">Visualize your job search timeline and interview dates.</span>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-lg p-6 flex flex-col items-center shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:border-purple-400">
                                <div className="bg-purple-100 text-purple-600 rounded-full p-3 mb-2"><svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-8 0v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                                <span className="font-semibold mb-1">User Settings</span>
                                <span className="text-gray-500 text-sm text-center">Customize your profile, preferences, and notification settings.</span>
                            </div>
                        </div>
                    </section>

                    {/* Why Choose Us Section */}
                    <section className="w-full max-w-4xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Why Choose SmartApply?</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                            <div className="flex flex-col items-center">
                                <div className="bg-blue-100 text-blue-600 rounded-full p-4 mb-2"><svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg></div>
                                <span className="font-semibold text-lg mb-1">Save Time</span>
                                <span className="text-gray-500 text-center">Automate your job search and applications in minutes.</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="bg-green-100 text-green-600 rounded-full p-4 mb-2"><svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg></div>
                                <span className="font-semibold text-lg mb-1">Get More Interviews</span>
                                <span className="text-gray-500 text-center">Increase your chances with AI-matched jobs and resume tips.</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="bg-yellow-100 text-yellow-600 rounded-full p-4 mb-2"><svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 11h8M8 15h6"/></svg></div>
                                <span className="font-semibold text-lg mb-1">Data Privacy</span>
                                <span className="text-gray-500 text-center">Your data and resumes are secure and never shared.</span>
                            </div>
                        </div>
                    </section>

                    {/* Call to Action Section */}
                    <section className="w-full max-w-2xl mx-auto mb-20 flex flex-col items-center">
                        <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">Ready to get started?</h2>
                        <button
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg text-lg shadow transition mb-2"
                            onClick={triggerFileUpload}
                            disabled={isLoadingSkills}
                        >
                            {isLoadingSkills ? 'Uploading & Parsing...' : 'Upload Resume & Start Applying'}
                        </button>
                        <span className="text-gray-500 text-sm">No signup required. 100% free for job seekers.</span>
                    </section>

                    {/* Add job list below upload area */}
                    <div className="w-full max-w-2xl mx-auto mt-8">
                        <GeneratedJobs
                            jobs={filteredJobs}
                            isLoading={isLoadingJobs}
                            isAutoApplied={isAutoApplied}
                            onAutoApply={simulateAutoApply}
                            savedJobs={savedJobs}
                            setSavedJobs={setSavedJobs}
                            JobSkeleton={JobSkeleton}
                        />
                    </div>

                    {/* Companies You Can Apply To Section */}
                    <section className="w-full max-w-5xl mx-auto mb-16 animate-fadeIn" style={{ animationDelay: '1.7s' }}>
                        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8 flex items-center justify-center gap-2">
                            <span>Featured Opportunities</span>
                            <span className="text-2xl">🎉</span>
                        </h2>
                        <div className="relative">
                            <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
                                <div className="flex gap-6 animate-slide-horizontal">
                                    {/* Demo data for featured opportunities */}
                                    {[
                                        {
                                            image: 'https://assets.unstop.com/competition/63e0e1b2b7b2e_HackRx-6.0-Bajaj-Finserv-2024-competition-banner.png',
                                            logo: 'https://logo.clearbit.com/bajajfinserv.in',
                                            title: 'Bajaj Finserv HackRx 6.0 | Register Now',
                                            company: 'Bajaj Finserv',
                                            type: 'Internship/Job',
                                            registered: '29,936',
                                            timeLeft: '14 days left',
                                            link: '#',
                                            badge: 'Offline',
                                            free: true
                                        },
                                        {
                                            image: 'https://assets.unstop.com/competition/63e0e1b2b7b2e_Sanjeevani-Film-Making-Challenge-2024-banner.png',
                                            logo: 'https://logo.clearbit.com/network18online.com',
                                            title: 'Network 18 | Sanjeevani Film Making Challenge',
                                            company: 'Network 18',
                                            type: 'Competition',
                                            registered: '863',
                                            timeLeft: '8 hours left',
                                            link: '#',
                                            badge: 'Online',
                                            free: true
                                        },
                                        {
                                            image: '/images/airtel.png',
                                            logo: 'https://logo.clearbit.com/airtel.com',
                                            title: 'Airtel iCreate 2025',
                                            company: 'Airtel',
                                            type: 'Competition',
                                            registered: '',
                                            timeLeft: '10 days left',
                                            link: '#',
                                            badge: 'Online',
                                        },
                                        {
                                            image: '/images/loreal.png',
                                            logo: 'https://logo.clearbit.com/loreal.com',
                                            title: "L'Oréal Sustainability Challenge 2025",
                                            company: "L'Oréal",
                                            type: 'Competition',
                                            registered: '',
                                            timeLeft: '16 days left',
                                            link: '#',
                                            badge: 'Online',
                                        },
                                        {
                                            image: '/images/sanjeevani.png',
                                            logo: 'https://logo.clearbit.com/sanjeevani.com',
                                            title: 'Sanjeevani Film Making Challenge 2024',
                                            company: 'Sanjeevani',
                                            type: 'Festival',
                                            registered: '',
                                            timeLeft: '5 days left',
                                            link: '#',
                                            badge: 'Festival',
                                        },
                                        {
                                            image: '/images/tcs.png',
                                            logo: 'https://logo.clearbit.com/tcs.com',
                                            title: 'TCS CodeVita 2025',
                                            company: 'TCS',
                                            type: 'Competition',
                                            registered: '',
                                            timeLeft: '20 days left',
                                            link: '#',
                                            badge: 'Online',
                                        },
                                        {
                                            image: '/images/google.png',
                                            logo: 'https://logo.clearbit.com/google.com',
                                            title: 'Google Summer of Code 2025',
                                            company: 'Google',
                                            type: 'Internship',
                                            registered: '',
                                            timeLeft: '30 days left',
                                            link: '#',
                                            badge: 'Online',
                                        },
                                        {
                                            image: '/images/microsoft.png',
                                            logo: 'https://logo.clearbit.com/microsoft.com',
                                            title: 'Microsoft Imagine Cup 2025',
                                            company: 'Microsoft',
                                            type: 'Competition',
                                            registered: '',
                                            timeLeft: '25 days left',
                                            link: '#',
                                            badge: 'Online',
                                        },
                                        {
                                            image: '/images/network.png',
                                            logo: 'https://logo.clearbit.com/network.com',
                                            title: 'Network Hackathon 2025',
                                            company: 'Network',
                                            type: 'Hackathon',
                                            registered: '',
                                            timeLeft: '18 days left',
                                            link: '#',
                                            badge: 'Online',
                                        },
                                        {
                                            image: '/images/bajaj.png',
                                            logo: 'https://logo.clearbit.com/bajaj.com',
                                            title: 'Bajaj Finserv Innovation Challenge',
                                            company: 'Bajaj Finserv',
                                            type: 'Competition',
                                            registered: '',
                                            timeLeft: '12 days left',
                                            link: '#',
                                            badge: 'Online',
                                        },
                                        {
                                            image: '/images/infosys.png',
                                            logo: 'https://logo.clearbit.com/infosys.com',
                                            title: 'Infosys Spark 2025',
                                            company: 'Infosys',
                                            type: 'Competition',
                                            registered: '',
                                            timeLeft: '22 days left',
                                            link: '#',
                                            badge: 'Online',
                                        },
                                        {
                                            image: '/images/accenture.png',
                                            logo: 'https://logo.clearbit.com/accenture.com',
                                            title: 'Accenture Innovation Challenge',
                                            company: 'Accenture',
                                            type: 'Hackathon',
                                            registered: '',
                                            timeLeft: '15 days left',
                                            link: '#',
                                            badge: 'Online',
                                        },
                                        {
                                            image: '/images/hcl.png',
                                            logo: 'https://logo.clearbit.com/hcl.com',
                                            title: 'HCL TechBee 2025',
                                            company: 'HCL',
                                            type: 'Internship',
                                            registered: '',
                                            timeLeft: '28 days left',
                                            link: '#',
                                            badge: 'Online',
                                        },
                                        {
                                            image: '/images/wipro.png',
                                            logo: 'https://logo.clearbit.com/wipro.com',
                                            title: 'Wipro CodeStorm',
                                            company: 'Wipro',
                                            type: 'Competition',
                                            registered: '',
                                            timeLeft: '19 days left',
                                            link: '#',
                                            badge: 'Online',
                                        },
                                        {
                                            image: '/images/amazon.png',
                                            logo: 'https://logo.clearbit.com/amazon.com',
                                            title: 'Amazon ML Challenge',
                                            company: 'Amazon',
                                            type: 'Hackathon',
                                            registered: '',
                                            timeLeft: '24 days left',
                                            link: '#',
                                            badge: 'Online',
                                        }
                                    ].map((op, idx) => (
                                        <div key={idx} className="inline-block bg-white border border-gray-100 rounded-xl shadow-lg w-80 mr-2 transition-transform duration-300 hover:scale-105 relative">
                                            <div className="relative h-40 w-full overflow-hidden rounded-t-xl">
                                                {/* Logo image */}
                                                <img src={op.logo} alt={op.company + ' logo'} className="absolute top-2 left-2 w-10 h-10 rounded-full border-2 border-white shadow z-10 bg-white object-contain" />
                                                <img src={op.image} alt={op.title} className="object-cover w-full h-full animate-move-horizontal" style={{ animationDelay: `${idx * 0.5}s` }} />
                                                {op.badge && <span className="absolute top-2 left-14 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold z-10">{op.badge}</span>}
                                                {op.free && <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold z-10">Free</span>}
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-lg text-gray-800 mb-1 truncate">{op.title}</h3>
                                                <div className="text-gray-500 text-sm mb-2">{op.company}</div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">{op.type}</span>
                                                    {op.registered && <span className="text-xs text-gray-400 flex items-center gap-1"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-8 0v2"/><circle cx="12" cy="7" r="4"/></svg>{op.registered} Registered</span>}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">{op.timeLeft}</span>
                                                    <a href={op.link} className="text-blue-600 font-semibold hover:underline text-xs">Learn More</a>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <style>{`
                            @keyframes slide-horizontal {
                                0% { transform: translateX(0); }
                                100% { transform: translateX(-50%); }
                            }
                            .animate-slide-horizontal {
                                animation: slide-horizontal 20s linear infinite;
                            }
                            @keyframes move-horizontal {
                                0% { transform: translateX(0); }
                                100% { transform: translateX(20px); }
                            }
                            .animate-move-horizontal {
                                animation: move-horizontal 2s alternate infinite;
                            }
                            .scrollbar-hide::-webkit-scrollbar { display: none; }
                            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                        `}</style>
                    </section>

                    {/* Testimonials Section */}
                    <section className="w-full max-w-4xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">What Our Users Say</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="bg-white border border-gray-100 rounded-lg p-6 flex flex-col items-center shadow-sm">
                                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-16 h-16 rounded-full mb-3" />
                                <p className="text-gray-700 text-center mb-2">"SmartApply helped me land 5 interviews in a week! The auto-apply feature is a game changer."</p>
                                <span className="font-semibold text-blue-700">Rahul S.</span>
                                <span className="text-gray-400 text-xs">Software Engineer</span>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-lg p-6 flex flex-col items-center shadow-sm">
                                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" className="w-16 h-16 rounded-full mb-3" />
                                <p className="text-gray-700 text-center mb-2">"I love the resume analyzer and the dashboard. It's so easy to track my job search now."</p>
                                <span className="font-semibold text-blue-700">Priya M.</span>
                                <span className="text-gray-400 text-xs">Data Analyst</span>
                            </div>
                        </div>
                    </section>

                    {/* FAQ Section */}
                    <section className="w-full max-w-4xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Frequently Asked Questions</h2>
                        <div className="space-y-6">
                            <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
                                <h3 className="font-semibold text-lg mb-2 text-blue-700">Is SmartApply free to use?</h3>
                                <p className="text-gray-600">Yes! SmartApply is 100% free for job seekers. No hidden fees.</p>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
                                <h3 className="font-semibold text-lg mb-2 text-blue-700">How does auto-apply work?</h3>
                                <p className="text-gray-600">Our AI matches your resume to jobs and simulates applications to maximize your chances. No real applications are sent without your review.</p>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
                                <h3 className="font-semibold text-lg mb-2 text-blue-700">Is my data safe?</h3>
                                <p className="text-gray-600">Absolutely. Your data and resumes are securely stored and never shared with third parties.</p>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
                                <h3 className="font-semibold text-lg mb-2 text-blue-700">Can I upload multiple resumes?</h3>
                                <p className="text-gray-600">Yes, you can upload and manage multiple resumes for different job types.</p>
                            </div>
                        </div>
                    </section>

                    {/* Our Numbers Section */}
                    <section className="w-full max-w-6xl mx-auto mb-16">
                        <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-10 tracking-tight">Our Numbers</h2>
                        <div className="flex flex-wrap justify-center gap-8">
                            {/* Card 1 */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-8 flex flex-col items-center min-w-[180px] transition-transform duration-300 hover:scale-105">
                                <div className="bg-blue-100 rounded-full p-3 mb-2"><svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg></div>
                                <span className="text-4xl font-extrabold text-blue-700 mb-1 animate-pulse">25M+</span>
                                <span className="text-gray-600 text-base font-medium">Active Users</span>
                            </div>
                            {/* Card 2 */}
                            <div className="bg-gradient-to-br from-blue-50 to-green-100 rounded-2xl shadow-lg p-8 flex flex-col items-center min-w-[180px] transition-transform duration-300 hover:scale-105">
                                <div className="bg-green-100 rounded-full p-3 mb-2"><svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg></div>
                                <span className="text-4xl font-extrabold text-green-700 mb-1 animate-pulse">22.3M+</span>
                                <span className="text-gray-600 text-base font-medium">Assessments</span>
                            </div>
                            {/* Card 3 */}
                            <div className="bg-gradient-to-br from-purple-50 to-blue-100 rounded-2xl shadow-lg p-8 flex flex-col items-center min-w-[180px] transition-transform duration-300 hover:scale-105">
                                <div className="bg-purple-100 rounded-full p-3 mb-2"><svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 11h8M8 15h6"/></svg></div>
                                <span className="text-4xl font-extrabold text-purple-700 mb-1 animate-pulse">130K+</span>
                                <span className="text-gray-600 text-base font-medium">Opportunities</span>
                            </div>
                            {/* Card 4 */}
                            <div className="bg-gradient-to-br from-yellow-50 to-blue-100 rounded-2xl shadow-lg p-8 flex flex-col items-center min-w-[180px] transition-transform duration-300 hover:scale-105">
                                <div className="bg-yellow-100 rounded-full p-3 mb-2"><svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-8 0v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                                <span className="text-4xl font-extrabold text-yellow-600 mb-1 animate-pulse">800+</span>
                                <span className="text-gray-600 text-base font-medium">Brands trust us</span>
                            </div>
                            {/* Card 5 */}
                            <div className="bg-gradient-to-br from-pink-50 to-blue-100 rounded-2xl shadow-lg p-8 flex flex-col items-center min-w-[180px] transition-transform duration-300 hover:scale-105">
                                <div className="bg-pink-100 rounded-full p-3 mb-2"><svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 11h8M8 15h6"/></svg></div>
                                <span className="text-4xl font-extrabold text-pink-600 mb-1 animate-pulse">42K+</span>
                                <span className="text-gray-600 text-base font-medium">Organisations</span>
                            </div>
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="w-full bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200 min-h-[420px] animate-fadeIn border-t-4 border-blue-500 relative overflow-hidden flex flex-col justify-center items-center z-50" style={{ animationDelay: '2.7s' }}>
                        <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(circle at 20% 40%, rgba(59,130,246,0.10) 0, transparent 70%), radial-gradient(circle at 80% 60%, rgba(168,85,247,0.10) 0, transparent 70%)'}}></div>
                        <div className="max-w-4xl w-full mx-auto flex flex-col items-center px-4 py-8 relative z-10">
                            <span className="text-3xl font-bold text-white mb-2">SmartApply</span>
                            <span className="text-gray-400 text-lg mb-4">© {new Date().getFullYear()} All rights reserved.</span>
                            <div className="flex gap-4 mb-6">
                                <a href="#" className="hover:text-blue-400" aria-label="Twitter"><svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.59-2.47.7a4.3 4.3 0 001.88-2.37 8.59 8.59 0 01-2.72 1.04A4.28 4.28 0 0016.11 4c-2.37 0-4.29 1.92-4.29 4.29 0 .34.04.67.1.99C7.69 9.13 4.07 7.38 1.64 4.7c-.37.64-.58 1.38-.58 2.17 0 1.5.76 2.82 1.92 3.6-.7-.02-1.36-.21-1.94-.53v.05c0 2.1 1.5 3.85 3.5 4.25-.36.1-.74.16-1.13.16-.28 0-.54-.03-.8-.08.54 1.7 2.1 2.94 3.95 2.97A8.6 8.6 0 012 19.54c-.29 0-.57-.02-.85-.05A12.13 12.13 0 007.29 21.5c7.55 0 11.68-6.26 11.68-11.68 0-.18-.01-.36-.02-.54A8.18 8.18 0 0024 4.59a8.36 8.36 0 01-2.54.7z"/></svg></a>
                                <a href="#" className="hover:text-blue-400" aria-label="LinkedIn"><svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm13.5 10.28h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39v4.58h-3v-9h2.89v1.23h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v4.72z"/></svg></a>
                                <a href="#" className="hover:text-blue-400" aria-label="Facebook"><svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.733 0-1.325.592-1.325 1.325v21.351c0 .732.592 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.672c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.312h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.322-.592 1.322-1.324v-21.35c0-.733-.592-1.325-1.325-1.325z"/></svg></a>
                            </div>
                            {/* Contact Us Section */}
                            <div id="contact" className="w-full max-w-2xl mx-auto mt-8 px-4 relative z-10 flex flex-col items-center">
                                <h3 className="text-3xl font-extrabold text-white mb-6 tracking-tight">Contact Us</h3>
                                <p className="text-gray-300 mb-2 text-lg">Email: <a href="mailto:support@smartapply.com" className="text-blue-400 underline">support@smartapply.com</a></p>
                                <p className="text-gray-400 text-base mb-6">We usually respond within 24 hours.</p>
                                <form className="w-full bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-8 flex flex-col gap-5 shadow-lg" onSubmit={e => {e.preventDefault(); setContactSuccess(true); setTimeout(()=>setContactSuccess(false), 2500);}}>
                                    <input type="text" placeholder="Your Name" className="bg-gray-700 text-white rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" required />
                                    <input type="email" placeholder="Your Email" className="bg-gray-700 text-white rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" required />
                                    <textarea placeholder="Your Message" className="bg-gray-700 text-white rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" rows={4} required></textarea>
                                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg shadow transition duration-200 active:scale-95">Send Message</button>
                                    {contactSuccess && <div className="text-green-400 font-semibold mt-2">Thank you! Your message has been sent.</div>}
                                </form>
                            </div>
                        </div>
                    </footer>
                </main>
            )}

            {/* Modals for Auth (if you choose to use a modal) */}
            {showAuthModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                        <AuthForm
                            onGoogleSignIn={handleGoogleSignIn}
                            onEmailSignIn={handleEmailSignIn}
                            onEmailSignUp={handleEmailSignUp}
                            error={authError || message}
                            mode={authMode}
                            onClose={() => setShowAuthModal(false)}
                            onToggleMode={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                        />
                    </div>
                </div>
            )}

            <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
};

export default App;