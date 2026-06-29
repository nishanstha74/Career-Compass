import React, { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import appLogo from "../assets/Career Compass Logo.png";
import {
  Compass,
  CheckCircle,
  TrendingUp,
  Map,
  ArrowRight,
  Cpu,
  Upload,
  Sparkles,
  ChevronRight,
  FileText,
} from "lucide-react";

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  // Automatically push the user to the dashboard if a valid login session exists
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/dashboard", { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Handler for manual button clicks (safety fallback)
  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate("/dashboard");
    } else {
      navigate("/signup");
    }
  };

  const handleSignInClick = () => {
    if (isSignedIn) {
      navigate("/dashboard");
    } else {
      navigate("/signin");
    }
  };

  // Prevent landing page content from flashing briefly while checking authentication status
  if (!isLoaded || isSignedIn) {
    return null;
  }

  const systemModules = [
    {
      icon: Compass,
      title: "Find Your Best Career Fit",
      desc: "Upload your resume and find out instantly which technical subdomains (Frontend, Backend, DevOps, Data Science) match your current skillset.",
      tag: "Career Matcher",
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
    {
      icon: CheckCircle,
      title: "Test Your Resume Against Real Jobs",
      desc: "Don't guess if your resume will be rejected. Compare your skills with real industry descriptions to see exactly how your profile scores.",
      tag: "ATS Optimization",
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      icon: TrendingUp,
      title: "Spot Your Tech Skill Gaps",
      desc: "Our engine scans your professional history and highlights exactly what skills you are missing to land your dream technical role.",
      tag: "Gap Analyzer",
      color: "bg-rose-50 text-rose-600 border-rose-100",
    },
    {
      icon: Map,
      title: "Your Personalized Study Roadmap",
      desc: "Get an interactive, step-by-step custom guide built to teach you exactly the tools you are missing. Stop wasting time on what you already know.",
      tag: "Learning Roadmap",
      color: "bg-purple-50 text-purple-600 border-purple-100",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-600 selection:text-white flex flex-col justify-between scroll-smooth">
      {/* Universal CSS Entry & Hover System */}
      <style>{`
        @keyframes fadeInUpCustom {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Auto entry animation rule applied directly to components */
        .render-animate-card {
          opacity: 0;
          animation: fadeInUpCustom 0.5s cubic-bezier(0.215, 0.610, 0.355, 1) forwards;
        }

        /* Staggered dynamic timeline speeds */
        .delay-0 { animation-delay: 50ms; }
        .delay-1 { animation-delay: 150ms; }
        .delay-2 { animation-delay: 250ms; }
        .delay-3 { animation-delay: 350ms; }
      `}</style>

      {/* 1. HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 h-16 flex items-center justify-between px-6 md:px-12">
        <div
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <div className="w-9 h-9 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105">
            <img
              src={appLogo}
              alt="CareerCompass Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            <span className="font-bold text-base tracking-tight block leading-tight text-slate-900 group-hover:text-indigo-600 transition-colors duration-300">
              CareerCompass
            </span>
            <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 block uppercase">
              AI Career Planner
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold tracking-wider uppercase">
          <a
            href="#features"
            className="text-slate-500 hover:text-indigo-600 relative py-2 transition-colors duration-300 group"
          >
            Features
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-center"></span>
          </a>
          <a
            href="#pipeline"
            className="text-slate-500 hover:text-indigo-600 relative py-2 transition-colors duration-300 group"
          >
            How It Works
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-center"></span>
          </a>
        </nav>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSignInClick}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-4 py-2 rounded-xl transition-all duration-200"
          >
            Sign In
          </button>

          <button
            onClick={handleGetStarted}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 shadow-sm shadow-indigo-100 flex items-center space-x-1"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN CORE */}
      <main className="flex-1 pt-16">
        {/* HERO SECTION */}
        <section className="relative px-6 py-16 md:py-24 max-w-7xl mx-auto text-center overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-indigo-500/5 blur-[120px] -z-10 rounded-full" />

          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight md:leading-none">
              Empower Your Tech Career Path with{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Adaptive Intelligence
              </span>
            </h1>

            <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Upload your technical resume to parse background fields, rank
              matching tech subdomains using trained ML classifiers, calculate
              real-time ATS scoring parameters, and design custom learning
              roadmaps.
            </p>

            <div className="pt-4">
              <button
                onClick={handleGetStarted}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-md flex items-center justify-center space-x-3 group mx-auto active:scale-[0.98]"
              >
                <span>Launch Your Analysis</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section
          id="features"
          className="px-6 py-16 max-w-7xl mx-auto border-t border-slate-200 scroll-mt-24"
        >
          <div className="text-center mb-12">
            <span className="font-mono text-xs text-indigo-600 uppercase tracking-[0.2em] block mb-2 font-bold">
              Personalized Tools
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              Your Personal Career Command Center
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {systemModules.map((feat, index) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className={`render-animate-card delay-${index} bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all duration-300 cubic-bezier(0.4,0,0.2,1) hover:-translate-y-1.5 hover:shadow-lg hover:border-indigo-100 group`}
                >
                  <div className="space-y-4">
                    <div
                      className={`w-12 h-12 ${feat.color} rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-base text-slate-900 tracking-tight leading-snug">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {feat.desc}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider flex justify-between">
                    <span>Feature:</span>
                    <span className="text-indigo-600">{feat.tag}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section
          id="pipeline"
          className="px-6 py-16 max-w-7xl mx-auto border-t border-slate-200 scroll-mt-24 bg-slate-100/50 rounded-3xl"
        >
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              How CareerCompass Works
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
              Get personalized insights and study paths in three straightforward
              steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            {/* Step 1 */}
            <div className="render-animate-card delay-0 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative overflow-hidden transition-all duration-300 cubic-bezier(0.4,0,0.2,1) hover:-translate-y-1.5 hover:shadow-lg hover:border-indigo-100 group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 flex items-center justify-center text-4xl font-bold text-slate-200 group-hover:text-indigo-100 transition-colors">
                01
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-6 text-indigo-600">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Upload Your CV
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Drop your current resume in PDF format. Our analyzer instantly
                pulls your technical expertise and background.
              </p>
            </div>

            {/* Step 2 */}
            <div className="render-animate-card delay-1 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative overflow-hidden transition-all duration-300 cubic-bezier(0.4,0,0.2,1) hover:-translate-y-1.5 hover:shadow-lg hover:border-indigo-100 group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 flex items-center justify-center text-4xl font-bold text-slate-200 group-hover:text-indigo-100 transition-colors">
                02
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-6 text-indigo-600">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Reveal Gaps & Matches
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                See your best tech career matches based on what you know.
                Compare your profile with job specs to find key missing skills.
              </p>
            </div>

            {/* Step 3 */}
            <div className="render-animate-card delay-2 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative overflow-hidden transition-all duration-300 cubic-bezier(0.4,0,0.2,1) hover:-translate-y-1.5 hover:shadow-lg hover:border-indigo-100 group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 flex items-center justify-center text-4xl font-bold text-slate-200 group-hover:text-indigo-100 transition-colors">
                03
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-6 text-indigo-600">
                <ChevronRight className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Upskill & Track
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Follow your tailor-made study roadmap to master only your
                missing skills. Tick off phases as you level up.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 3. FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          <div className="space-y-4 md:col-span-1 pr-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center text-slate-950">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-sm tracking-tight">
                CareerCompass
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Empowering the next generation of tech talent with sophisticated,
              personalized career diagnostics and adaptive learning paths.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-indigo-400 font-bold uppercase tracking-wider text-[11px] font-mono">
              Explore
            </h4>
            <ul className="space-y-3 text-slate-300 font-medium text-[13px]">
              <li>
                <a
                  href="#features"
                  className="hover:text-indigo-400 transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#pipeline"
                  className="hover:text-indigo-400 transition-colors"
                >
                  How it Works
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-indigo-400 font-bold uppercase tracking-wider text-[11px] font-mono">
              Legal
            </h4>
            <ul className="space-y-3 text-slate-300 font-medium text-[13px]">
              <li>
                <a href="#" className="hover:text-indigo-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-400 transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-indigo-400 font-bold uppercase tracking-wider text-[11px] font-mono">
              Support & Feedback
            </h4>
            <ul className="space-y-3 text-slate-300 font-medium text-[13px]">
              <li>
                <a href="#" className="hover:text-indigo-400 transition-colors">
                  Contact Support
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-400 transition-colors">
                  Give Feedback / Report a Bug
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-[11px] font-medium">
            © {new Date().getFullYear()} CareerCompass. All rights reserved.
          </p>
          <p className="text-slate-600 uppercase tracking-widest text-[9px] font-mono font-semibold">
            Interactive Career Intelligence Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
