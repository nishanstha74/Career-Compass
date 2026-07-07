import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import appLogo from "../../assets/Career Compass Logo.png";
import FeedbackModal from "../modals/FeedbackModal";
import {
  Compass,
  CheckCircle,
  TrendingUp,
  Map,
  ArrowRight,
  Upload,
  ChevronRight,
  FileText,
} from "lucide-react";

// ---------- Scroll-reveal hook ----------
// Fires once, the first time the element enters the viewport, then stays revealed.
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

// ---------- Feature card ----------
function FeatureCard({ feat, index }) {
  const [ref, inView] = useInView();
  const Icon = feat.icon;

  return (
    <div
      ref={ref}
      style={{ transitionDelay: inView ? `${index * 90}ms` : "0ms" }}
      className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between
        transition-all duration-700 ease-out
        hover:-translate-y-1.5 hover:shadow-lg hover:border-indigo-200
        motion-reduce:transition-none motion-reduce:transform-none
        group
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      <div className="space-y-4">
        <div
          className={`w-12 h-12 ${feat.color} rounded-xl flex items-center justify-center shadow-inner
            transition-transform duration-300 ease-out
            group-hover:scale-110 group-hover:-rotate-3`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-base text-slate-900 tracking-tight leading-snug transition-colors duration-300 group-hover:text-indigo-600">
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
}

// ---------- "How it works" step card ----------
function StepCard({ step, index }) {
  const [ref, inView] = useInView();
  const Icon = step.icon;

  return (
    <div
      ref={ref}
      style={{ transitionDelay: inView ? `${index * 120}ms` : "0ms" }}
      className={`bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative overflow-hidden
        transition-all duration-700 ease-out
        hover:-translate-y-1.5 hover:shadow-lg hover:border-indigo-200
        motion-reduce:transition-none motion-reduce:transform-none
        group
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 flex items-center justify-center text-4xl font-bold text-slate-200 transition-colors duration-300 group-hover:text-indigo-100">
        {step.number}
      </div>
      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-6 text-indigo-600 transition-transform duration-300 ease-out group-hover:scale-110">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-bold text-lg text-slate-900 mb-2 transition-colors duration-300 group-hover:text-indigo-600">
        {step.title}
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
    </div>
  );
}

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

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

  // Smooth-scroll to a section when a nav link is clicked
  const handleNavClick = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const pipelineSteps = [
    {
      number: "01",
      icon: Upload,
      title: "Upload Your CV",
      desc: "Drop your current resume in PDF format. Our analyzer instantly pulls your technical expertise and background.",
    },
    {
      number: "02",
      icon: FileText,
      title: "Reveal Gaps & Matches",
      desc: "See your best tech career matches based on what you know. Compare your profile with job specs to find key missing skills.",
    },
    {
      number: "03",
      icon: ChevronRight,
      title: "Upskill & Track",
      desc: "Follow your tailor-made study roadmap to master only your missing skills. Tick off phases as you level up.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-600 selection:text-white flex flex-col justify-between scroll-smooth">
      {/* 1. HEADER (DYNAMIC NAVIGATION BAR) */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 h-16 flex items-center justify-between px-6 md:px-12 transition-shadow duration-300 hover:shadow-sm">
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
            <span className="font-bold text-base tracking-tight block leading-tight text-slate-900 transition-colors duration-300 group-hover:text-indigo-600">
              CareerCompass
            </span>
            <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 block uppercase">
              AI Career Planner
            </span>
          </div>
        </div>

        {/* Navigation Anchor Links */}
        <div className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wider uppercase text-slate-500">
          <a
            href="#features"
            onClick={(e) => handleNavClick(e, "features")}
            className="relative py-2 group transition-colors duration-300 hover:text-indigo-600"
          >
            Features
            <span className="absolute left-0 -bottom-0.5 h-[2px] w-0 bg-indigo-600 transition-all duration-300 group-hover:w-full" />
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => handleNavClick(e, "how-it-works")}
            className="relative py-2 group transition-colors duration-300 hover:text-indigo-600"
          >
            How It Works
            <span className="absolute left-0 -bottom-0.5 h-[2px] w-0 bg-indigo-600 transition-all duration-300 group-hover:w-full" />
          </a>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleSignInClick}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg transition-all duration-300 hover:bg-slate-100"
          >
            Sign In
          </button>

          <button
            onClick={handleGetStarted}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-300 shadow-sm shadow-indigo-100 hover:shadow-md hover:shadow-indigo-200 hover:-translate-y-0.5 flex items-center space-x-1 group active:translate-y-0"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </header>

      {/* 2. HERO INNER INTERFACE */}
      <main className="flex-1 pt-16">
        {/* HERO INTRO CONTENT SECTION */}
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-indigo-200 flex items-center justify-center space-x-3 group mx-auto active:scale-[0.98] hover:-translate-y-0.5"
              >
                <span>Get Your Career Map</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section
          id="features"
          className="px-6 py-16 max-w-7xl mx-auto border-t border-slate-200 scroll-mt-20"
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
            {systemModules.map((feat, i) => (
              <FeatureCard feat={feat} index={i} key={feat.title} />
            ))}
          </div>
        </section>

        {/* USER-CENTRIC "HOW IT WORKS" TIMELINE */}
        <section
          id="how-it-works"
          className="px-6 py-16 max-w-7xl mx-auto border-t border-slate-200 scroll-mt-20 bg-slate-100/50 rounded-3xl"
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
            {pipelineSteps.map((step, i) => (
              <StepCard step={step} index={i} key={step.title} />
            ))}
          </div>
        </section>
      </main>

      {/* 3. CLEAN USER-CENTRIC FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Identity Column */}
          <div className="space-y-4 md:col-span-1 pr-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 flex items-center justify-center shrink-0">
                <img
                  src={appLogo}
                  alt="CareerCompass Logo"
                  className="w-full h-full object-contain"
                />
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

          {/* Explore Links Block */}
          <div className="space-y-4">
            <h4 className="text-indigo-400 font-bold uppercase tracking-wider text-[11px] font-mono">
              Explore
            </h4>
            <ul className="space-y-3 text-slate-300 font-medium text-[13px]">
              <li>
                <a
                  href="#features"
                  onClick={(e) => handleNavClick(e, "features")}
                  className="hover:text-indigo-400 transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => handleNavClick(e, "how-it-works")}
                  className="hover:text-indigo-400 transition-colors"
                >
                  How it Works
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links Block */}
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

          {/* Support & Feedback Column */}
          <div className="space-y-4">
            <h4 className="text-indigo-400 font-bold uppercase tracking-wider text-[11px] font-mono">
              Support & Feedback
            </h4>
            <ul className="space-y-3 text-slate-300 font-medium text-[13px]">
              <li>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=shrestha.nishan060@gmail.com&su=CareerCompass%20Inquiry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-400 transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(true)}
                  className="hover:text-indigo-400 transition-colors text-left"
                >
                  Give Feedback
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Bar - Properly Aligned Outside Layout Grid */}
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-[11px] font-medium">
            © {new Date().getFullYear()} CareerCompass. All rights reserved.
          </p>
          <p className="text-slate-600 uppercase tracking-widest text-[9px] font-mono font-semibold">
            Interactive Career Intelligence Platform
          </p>
        </div>
      </footer>

      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </div>
  );
}
