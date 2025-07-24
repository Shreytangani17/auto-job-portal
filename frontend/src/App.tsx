import React, { useState, useRef, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import ResumeUpload from './components/ResumeUpload';
import AutoApplySettings from './components/AutoApplySettings';
import ExtractedSkills from './components/ExtractedSkills';
import GeneratedJobs from './components/GeneratedJobs';
import ApplicationStatusDashboard from './components/ApplicationStatusDashboard';
import InsightsImprovements from './components/InsightsImprovements';
import AppliedJobsList from './components/AppliedJobsList';
import AuthForm from './components/AuthForm';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCu728JH0EqVsCl8Y-StuxSASQM8OYhCtA",
  authDomain: "resume-fb020.firebaseapp.com",
  projectId: "resume-fb020",
  storageBucket: "resume-fb020.firebasestorage.app",
  messagingSenderId: "962629586428",
  appId: "1:962629586428:web:250c018ca90544ebd37679",
  measurementId: "G-E4ELYTX66V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const GEMINI_API_KEY = "AIzaSyDXmbqSEhk5aDu39isIRquE4BCrB_9UzKQ";

const App = () => {
    // Firebase States
    const [db, setDb] = useState<any>(null);
    const [auth, setAuth] = useState<any>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [currentPage, setCurrentPage] = useState<'home' | 'dashboard'>('home');
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

        const initializeFirebase = async () => {
            try {
                const initialAuthToken = (window as any).__initial_auth_token || null;
                const firestore = getFirestore(app);
                const firebaseAuth = getAuth(app);
                setDb(firestore);
                setAuth(firebaseAuth);
                onAuthStateChanged(firebaseAuth, async (user) => {
                    if (user) {
                        setUserId(user.uid);
                        await loadUserData(firestore, user.uid, initialAuthToken);
                    } else {
                        // No fallback to anonymous sign-in
                        setUserId(null);
                    }
                    setLoadingAuth(false);
                });
            } catch (error: any) {
                setMessage(`Error initializing app: ${error.message}`);
                setLoadingAuth(false);
            }
        };
        initializeFirebase();
    }, []);

    const getUserDocRef = (firestore: any, currentUserId: string) => {
        const appId = (window as any).__app_id || 'default-app-id';
        return doc(firestore, `artifacts/${appId}/users/${currentUserId}/data/user_profile`);
    };

    const loadUserData = async (firestore: any, currentUserId: string, initialAuthToken: string | null) => {
        if (!firestore || !currentUserId) return;
        try {
            const userDocRef = getUserDocRef(firestore, currentUserId);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setResumeText(data.resumeData?.text || '');
                setExtractedSkills(data.resumeData?.skills || []);
                setGeneratedJobs(data.jobs || []);
                setIsAutoApplied(data.isAutoApplied || false);
                setAppliedJobsCount(data.appStatus?.appliedJobsCount || 0);
                setInReviewJobsCount(data.appStatus?.inReviewJobsCount || 0);
                setInterviewScheduledCount(data.appStatus?.interviewScheduledCount || 0);
                setResponseRate(data.appStatus?.responseRate || 0);
                setSuccessScore(data.insights?.successScore || 0);
                setAppPerformance(data.insights?.appPerformance || { responseRate: 0, interviewRate: 0, profileViews: 0 });
                setAutoApplyThreshold(data.settings?.autoApplyThreshold || 80);
                setJobTypes(data.settings?.jobTypes || { 'Full-time': true, 'Part-time': false, 'Contract': false, 'Remote': true });
                setMinSalary(data.settings?.minSalary || 60000);
                setMaxSalary(data.settings?.maxSalary || 150000);
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
        if (!db || !userId) return;
        try {
            const userDocRef = getUserDocRef(db, userId);
            const dataToSave = {
                resumeData: {
                    text: resumeText,
                    skills: extractedSkills,
                },
                jobs: generatedJobs,
                isAutoApplied: isAutoApplied,
                appStatus: {
                    appliedJobsCount,
                    inReviewJobsCount,
                    interviewScheduledCount,
                    responseRate,
                },
                insights: {
                    successScore,
                    appPerformance,
                },
                settings: {
                    autoApplyThreshold,
                    jobTypes,
                    minSalary,
                    maxSalary,
                },
                lastUpdated: new Date(),
            };
            await setDoc(userDocRef, dataToSave, { merge: true });
        } catch (error: any) {
            setMessage(`Error saving your data: ${error.message}`);
        }
    };

    useEffect(() => {
        if (!loadingAuth && userId) {
            saveUserData();
        }
    }, [
        resumeText, extractedSkills, generatedJobs, isAutoApplied,
        appliedJobsCount, inReviewJobsCount, interviewScheduledCount, responseRate,
        successScore, appPerformance,
        autoApplyThreshold, jobTypes, minSalary, maxSalary,
        loadingAuth, userId
    ]);

    const resetAllStates = () => {
        setResumeText('');
        setExtractedSkills([]);
        setGeneratedJobs([]);
        setIsLoadingSkills(false);
        setIsLoadingJobs(false);
        setMessage('');
        setIsAutoApplied(false);
        setAppliedJobsCount(0);
        setInReviewJobsCount(0);
        setInterviewScheduledCount(0);
        setResponseRate(0);
        setSuccessScore(0);
        setAppPerformance({ responseRate: 0, interviewRate: 0, profileViews: 0 });
    };

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
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
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

    const generateJobs = async (skills: string[]) => {
        if (skills.length === 0) {
            setMessage('No skills extracted to generate jobs. Please upload a resume with skills first.');
            setIsLoadingJobs(false);
            return;
        }
        setIsLoadingJobs(true);
        setGeneratedJobs([]);
        try {
            const skillsList = skills.join(', ');
            const prompt = `Generate 5 realistic job and/or internship descriptions for positions that would typically require the following skills. For each, provide a 'title', 'company', 'description', 'jobType' (e.g., 'Full-time', 'Part-time', 'Contract'), 'isRemote' (boolean), and a 'salary' (number, e.g., 85000). Ensure the descriptions are concise and highlight how the skills are relevant.\n\nSkills: ${skillsList}`;
            let chatHistory: any[] = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });
            const payload = {
                contents: chatHistory,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                "title": { "type": "STRING" },
                                "company": { "type": "STRING" },
                                "description": { "type": "STRING" },
                                "jobType": { "type": "STRING" },
                                "isRemote": { "type": "BOOLEAN" },
                                "salary": { "type": "NUMBER" }
                            },
                            "propertyOrdering": ["title", "company", "description", "jobType", "isRemote", "salary"]
                        }
                    }
                }
            };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
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
                const parsedJobs = JSON.parse(json);
                const filteredJobs = parsedJobs.filter((job: any) => {
                    const meetsJobType = jobTypes[job.jobType];
                    const meetsRemote = job.isRemote ? jobTypes['Remote'] : true;
                    const meetsSalary = job.salary >= minSalary && job.salary <= maxSalary;
                    const simulatedMatch = Math.random() * (100 - autoApplyThreshold) + autoApplyThreshold;
                    return meetsJobType && meetsRemote && meetsSalary && simulatedMatch >= autoApplyThreshold;
                }).map((job: any) => ({
                    ...job,
                    id: Math.random().toString(36).substring(2, 9),
                    status: 'Applied',
                    matchScore: Math.floor(Math.random() * (100 - autoApplyThreshold)) + autoApplyThreshold,
                    appliedDaysAgo: Math.floor(Math.random() * 7) + 1,
                    interviewScheduled: Math.random() < 0.3 ? true : false,
                    interviewTime: Math.random() < 0.3 ? `Tomorrow at ${Math.floor(Math.random() * 4) + 10}:00 AM` : null
                }));
                setGeneratedJobs(filteredJobs);
                setMessage('Job and internship suggestions generated successfully!');
            } else {
                setMessage('Failed to generate job suggestions. Please try again.');
            }
        } catch (error: any) {
            setMessage(`Error generating jobs: ${error.message}. Please try again.`);
        } finally {
            setIsLoadingJobs(false);
        }
    };

    const simulateAutoApply = () => {
        if (generatedJobs.length === 0) {
            setMessage('No jobs to apply to. Please upload your resume first and ensure settings allow jobs to be generated.');
            return;
        }
        let applied = 0;
        let inReview = 0;
        let interviews = 0;
        const updatedJobs = generatedJobs.map((job) => {
            applied++;
            if (job.interviewScheduled) {
                interviews++;
                return { ...job, status: 'Interview Scheduled' };
            } else if (Math.random() < 0.5) {
                inReview++;
                return { ...job, status: 'Under Review' };
            } else {
                return { ...job, status: 'Applied' };
            }
        });
        setGeneratedJobs(updatedJobs);
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
        if (auth) {
            try {
                await signOut(auth);
                setUserId(null);
                resetAllStates();
                setMessage('You have been logged out. Please sign in again.');
                setCurrentPage('home');
            } catch (error: any) {
                setMessage(`Error logging out: ${error.message}`);
            }
        }
    };

    // Add sign-in handlers
    const handleGoogleSignIn = async () => {
        setAuthError(null);
        try {
            const firebaseAuth = getAuth(app);
            const provider = new GoogleAuthProvider();
            await signInWithPopup(firebaseAuth, provider);
        } catch (error: any) {
            setAuthError(error.message || 'Google sign-in failed');
        }
    };

    const handleEmailSignIn = async (email: string, password: string) => {
        setAuthError(null);
        try {
            const firebaseAuth = getAuth(app);
            await signInWithEmailAndPassword(firebaseAuth, email, password);
        } catch (error: any) {
            setAuthError(error.message || 'Email sign-in failed');
        }
    };

    const handleEmailSignUp = async (email: string, password: string) => {
        setAuthError(null);
        try {
            const firebaseAuth = getAuth(app);
            await createUserWithEmailAndPassword(firebaseAuth, email, password);
        } catch (error: any) {
            setAuthError(error.message || 'Email sign-up failed');
        }
    };

    const handleAutoApplySettingsSubmit = async () => {
        setIsLoadingSettings(true);
        setMessage('');
        if (!db || !userId) {
            setMessage('Unable to save settings: Not signed in or database unavailable.');
            setIsLoadingSettings(false);
            return;
        }
        try {
            const userDocRef = getUserDocRef(db, userId);
            await setDoc(userDocRef, {
                settings: {
                    autoApplyThreshold,
                    jobTypes,
                    minSalary,
                    maxSalary,
                },
                lastUpdated: new Date(),
            }, { merge: true });
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
                body: JSON.stringify({ userId }),
            });
            const data = await res.json();
            setNotifyMessage(data.message || 'Notification triggered!');
        } catch (err) {
            setNotifyMessage('Failed to trigger notification.');
        }
    };

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

    // If not signed in, show AuthForm
    if (!userId) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <AuthForm
                    onGoogleSignIn={handleGoogleSignIn}
                    onEmailSignIn={handleEmailSignIn}
                    onEmailSignUp={handleEmailSignUp}
                    error={authError || message}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 font-sans flex flex-col items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Automated Job Application Simulator
                    </h1>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setCurrentPage('home')}
                            className={`px-4 py-2 rounded-lg font-semibold transition duration-300 ${currentPage === 'home' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            Home
                        </button>
                        <button
                            onClick={() => setCurrentPage('dashboard')}
                            className={`px-4 py-2 rounded-lg font-semibold transition duration-300 ${currentPage === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            Dashboard
                        </button>
                        {userId && (
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-600 transition duration-300"
                            >
                                Logout
                            </button>
                        )}
                    </div>
                </div>
                {message && (
                    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                        <span className="block sm:inline">{message}</span>
                    </div>
                )}
                {currentPage === 'home' && (
                    <>
                        <ResumeUpload
                            isLoading={isLoadingSkills}
                            onFileChange={handleFileChange}
                            resumeText={resumeText}
                            triggerFileUpload={triggerFileUpload}
                            fileInputRef={fileInputRef}
                        />
                        <AutoApplySettings
                            autoApplyThreshold={autoApplyThreshold}
                            setAutoApplyThreshold={setAutoApplyThreshold}
                            jobTypes={jobTypes}
                            setJobTypes={setJobTypes}
                            minSalary={minSalary}
                            setMinSalary={setMinSalary}
                            maxSalary={maxSalary}
                            setMaxSalary={setMaxSalary}
                            onSubmit={handleAutoApplySettingsSubmit}
                            loading={isLoadingSettings}
                        />
                        {extractedSkills.length > 0 && <ExtractedSkills skills={extractedSkills} />}
                        <GeneratedJobs
                            jobs={generatedJobs}
                            isLoading={isLoadingJobs}
                            isAutoApplied={isAutoApplied}
                            onAutoApply={simulateAutoApply}
                        />
                    </>
                )}
                {currentPage === 'dashboard' && (
                    <div className="space-y-8">
                        {userId && (
                            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200 text-blue-800 font-medium">
                                Your User ID: <span className="font-bold break-all">{userId}</span>
                            </div>
                        )}
                        <ApplicationStatusDashboard
                            appliedJobsCount={appliedJobsCount}
                            inReviewJobsCount={inReviewJobsCount}
                            interviewScheduledCount={interviewScheduledCount}
                            responseRate={responseRate}
                        />
                        <InsightsImprovements
                            successScore={successScore}
                            appPerformance={appPerformance}
                            improvementSuggestions={improvementSuggestions}
                        />
                        <AppliedJobsList jobs={generatedJobs} />
                        <button
                            onClick={handleNotify}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 mt-4"
                        >
                            Trigger Notification (Backend)
                        </button>
                        {notifyMessage && (
                            <div className="mt-2 text-center text-indigo-700">{notifyMessage}</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default App; 