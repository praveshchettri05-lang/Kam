"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { t, categories } from './i18n';

const STORAGE = 'kam-app-session-v2';

const rupee = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const normalizePhone = (value) => {
  const trimmed = (value || '').trim();
  const digits = trimmed.replace(/\D/g, '');
  if (/^\+[1-9]\d{7,14}$/.test(trimmed)) return trimmed;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return '';
};

function Icon({ name, size = 21 }) {
  const paths = {
    home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    chat: <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 4a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />,
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    speaker: <><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13" /></>,
    back: <path d="m15 18-6-6 6-6" />,
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0m-7 7v5m-4 0h8" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    alert: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Avatar({ initials, tone = 'peach' }) {
  return <span className={`avatar ${tone}`}>{initials}</span>;
}

export default function App() {
  const [locale, setLocale] = useState('en');
  const [tab, setTab] = useState('home');
  const [screen, setScreen] = useState('home');
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' or 'companion' (Paid Time)

  // User state
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    name: 'Pravesh',
    phone: '+919876543210',
    area: 'Indiranagar, Bengaluru',
    lat: 12.9716,
    lng: 77.5946,
    radius: 15,
    available: true,
    skills: ['cleaning', 'tutor'],
    rating: 4.9,
    reviews: 12,
  });

  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedJobDetail, setSelectedJobDetail] = useState(null);

  // Workers state
  const [workers, setWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [communitySubTab, setCommunitySubTab] = useState('workers'); // 'workers' or 'friends'

  // Chat state
  const [chats, setChats] = useState([
    {
      id: 'chat-1',
      name: 'Meera Sharma',
      initials: 'MS',
      phone: '+91 98765 43211',
      phoneShared: false,
      jobTitle: 'Need help cleaning 2-BHK home',
      offeredPay: 600,
      agreedPay: 600,
      status: 'In Discussion',
      preview: 'Is 10:30 am okay for you?',
      time: '9:42',
      unread: true,
      messages: [
        { from: 'them', text: 'Namaste! Are you available to help today?' },
        { from: 'me', text: 'Yes, I can come at 10:30 am.' },
        { from: 'them', text: 'Is 10:30 am okay for you?' },
      ],
    },
  ]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [counterPrice, setCounterPrice] = useState('');

  // UI state
  const [notice, setNotice] = useState('');
  const [otpPhone, setOtpPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [ratingModal, setRatingModal] = useState(null);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [myJobsTab, setMyJobsTab] = useState('posted'); // 'posted', 'applied', 'completed'

  // Job draft
  const [jobDraft, setJobDraft] = useState({
    title: '',
    details: '',
    category: 'cleaning',
    pay: '',
    payType: 'day',
    urgent: false,
  });

  const text = useCallback((key, values) => t(locale, key, values), [locale]);

  // Load session & language on mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('kam-language');
      if (savedLang) setLocale(savedLang);
      const savedSession = localStorage.getItem(STORAGE);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.user) setUser(parsed.user);
        if (parsed.profile) setProfile((prev) => ({ ...prev, ...parsed.profile }));
      }
    } catch (e) {
      console.warn('Session load error:', e);
    }
  }, []);

  // Save session changes
  useEffect(() => {
    try {
      localStorage.setItem('kam-language', locale);
      document.documentElement.lang = locale;
      localStorage.setItem(STORAGE, JSON.stringify({ user, profile }));
    } catch (e) {
      console.warn('Session save error:', e);
    }
  }, [locale, user, profile]);

  // Notice timeout
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  // Fetch jobs from live Neon PostgreSQL backend
  const fetchJobs = useCallback(async (lat, lng, radiusKm, cat) => {
    setLoadingJobs(true);
    try {
      const params = new URLSearchParams({
        lat: String(lat || 12.9716),
        lng: String(lng || 77.5946),
        radiusKm: String(radiusKm || 100),
      });
      if (cat && cat !== 'all') params.append('category', cat);
      const res = await fetch(`/api/jobs?${params.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.jobs)) {
        setJobs(json.jobs);
      }
    } catch (err) {
      console.error('Failed to fetch jobs from API:', err);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  // Fetch workers from live Neon PostgreSQL backend
  const fetchWorkers = useCallback(async (lat, lng, radiusKm) => {
    setLoadingWorkers(true);
    try {
      const params = new URLSearchParams({
        lat: String(lat || 12.9716),
        lng: String(lng || 77.5946),
        radiusKm: String(radiusKm || 100),
      });
      const res = await fetch(`/api/workers?${params.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.workers)) {
        setWorkers(json.workers);
      }
    } catch (err) {
      console.error('Failed to fetch workers:', err);
    } finally {
      setLoadingWorkers(false);
    }
  }, []);

  // Initial and reactive jobs & workers fetch
  useEffect(() => {
    fetchJobs(profile.lat, profile.lng, profile.radius, selectedCategory);
    fetchWorkers(profile.lat, profile.lng, profile.radius);
  }, [fetchJobs, fetchWorkers, profile.lat, profile.lng, profile.radius, selectedCategory]);

  // Filtered jobs for search & feed tabs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (feedFilter === 'companion' && job.category !== 'companion') return false;
      if (feedFilter === 'standard' && job.category === 'companion') return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const titleMatch = (job.title || '').toLowerCase().includes(q);
      const descMatch = (job.description || '').toLowerCase().includes(q);
      const catMatch = text(`cat_${job.category}`).toLowerCase().includes(q);
      const areaMatch = (job.areaLabel || '').toLowerCase().includes(q);
      const authorMatch = (job.poster?.name || '').toLowerCase().includes(q);
      return titleMatch || descMatch || catMatch || areaMatch || authorMatch;
    });
  }, [jobs, search, feedFilter, text]);

  // Text-To-Speech (Read Aloud)
  const speak = (value) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setNotice(text('speechUnsupported'));
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = locale === 'hi' ? 'hi-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  // Speech-To-Text (Voice Fill)
  const voiceFill = (onResult) => {
    if (typeof window === 'undefined') return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setNotice(text('voiceUnsupported'));
      return;
    }
    const recognition = new Recognition();
    recognition.lang = locale === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.onresult = (event) => onResult(event.results[0][0].transcript);
    recognition.onerror = () => setNotice(text('voiceError'));
    recognition.start();
  };

  // Share Live Location
  const shareLiveLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const mapUrl = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
          if (navigator.clipboard) {
            navigator.clipboard.writeText(mapUrl);
          }
          setNotice(text('liveLocationShared'));
        },
        () => {
          setNotice(text('liveLocationShared'));
        }
      );
    } else {
      setNotice(text('liveLocationShared'));
    }
  };

  // SOS Emergency Trigger
  const triggerSOS = () => {
    const sosMsg = `EMERGENCY ALERT: Need urgent assistance. Registered area: ${profile.area}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(sosMsg);
    }
    setNotice(text('sosAlertSent'));
    speak(locale === 'hi' ? 'आपातकालीन सूचना भेज दी गई है।' : 'Emergency alert sent.');
  };

  // OTP Login Handler
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    const phone = normalizePhone(otpPhone);
    if (!phone) {
      setAuthError('validPhone');
      return;
    }
    setAuthBusy(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpPhone(phone);
        setOtpSent(true);
        setNotice(text('otpDemoCode'));
      } else {
        setAuthError(data.error || 'authRequestFailed');
      }
    } catch (err) {
      setAuthError('authRequestFailed');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setAuthError('enterValidOtp');
      return;
    }
    setAuthBusy(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone, otp: otp.trim() }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setProfile((prev) => ({
          ...prev,
          name: data.user.name || prev.name,
          phone: data.user.phone || otpPhone,
        }));
        setOtpSent(false);
        setOtp('');
        setTab('home');
        setScreen('home');
        setNotice(locale === 'hi' ? 'सफलतापूर्वक साइन इन हुआ!' : 'Signed in successfully!');
      } else {
        setAuthError(data.error || 'otpVerificationFailed');
      }
    } catch (err) {
      setAuthError('otpVerificationFailed');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem(STORAGE);
    setTab('home');
    setScreen('home');
    setNotice(text('signedOut'));
  };

  // Publish Job Handler
  const publishJob = async (e) => {
    e.preventDefault();
    if (!jobDraft.title.trim() || !jobDraft.pay || Number(jobDraft.pay) <= 0) {
      setNotice(text('fillRequired'));
      return;
    }
    setAuthBusy(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: jobDraft.title.trim(),
          description: jobDraft.details.trim(),
          category: jobDraft.category,
          payAmount: Number(jobDraft.pay),
          payType: jobDraft.payType,
          isUrgent: jobDraft.urgent,
          posterId: user?.id,
          posterPhone: user?.phone || profile.phone,
          authorName: profile.name,
          lat: profile.lat,
          lng: profile.lng,
          areaLabel: profile.area,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice(text('jobPublished'));
        setTab('home');
        setScreen('home');
        setJobDraft({ title: '', details: '', category: 'cleaning', pay: '', payType: 'day', urgent: false });
        fetchJobs(profile.lat, profile.lng, profile.radius, selectedCategory);
      } else {
        setNotice(text('jobPublishFailed'));
      }
    } catch (err) {
      setNotice(text('jobPublishFailed'));
    } finally {
      setAuthBusy(false);
    }
  };

  // Open Chat with a Person
  const openChat = (posterName, job, workerPhone = '+91 98765 43211') => {
    let chat = chats.find((item) => item.name === posterName);
    if (!chat) {
      chat = {
        id: `chat-${Date.now()}`,
        name: posterName || 'Kam User',
        initials: (posterName || 'K').split(' ').map((p) => p[0]).join('').slice(0, 2),
        phone: workerPhone,
        phoneShared: false,
        jobTitle: job ? job.title : 'Work Inquiry',
        offeredPay: job ? job.payAmount : 500,
        agreedPay: job ? job.payAmount : 500,
        status: 'In Discussion',
        preview: text('newChat'),
        time: text('now'),
        unread: false,
        messages: [
          { from: 'them', text: `Hi! I saw your post: ${job ? job.title : 'Service inquiry'}. Let us finalize the details.` },
        ],
      };
      setChats([chat, ...chats]);
    }
    setSelectedChat(chat.id);
    setSelectedJobDetail(null);
    setTab('chat');
    setScreen('chat');
  };

  // Send Chat Message
  const sendMessage = (e) => {
    e.preventDefault();
    const input = currentMessage.trim();
    if (!input || !selectedChat) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedChat
          ? {
              ...c,
              preview: input,
              time: text('now'),
              messages: [...c.messages, { from: 'me', text: input }],
            }
          : c
      )
    );
    setCurrentMessage('');
  };

  // Send Counter Offer
  const sendCounterOffer = () => {
    const amount = parseInt(counterPrice, 10);
    if (isNaN(amount) || amount <= 0 || !selectedChat) return;
    const offerText = `Counter-offer: ${rupee(amount)}`;
    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedChat
          ? {
              ...c,
              agreedPay: amount,
              preview: offerText,
              messages: [
                ...c.messages,
                { from: 'me', text: `${text('counterOffer')}: ${rupee(amount)}` },
              ],
            }
          : c
      )
    );
    setCounterPrice('');
    setNotice(text('counterOffer') + ': ' + rupee(amount));
  };

  // Accept Counter Offer
  const acceptOffer = () => {
    if (!selectedChat) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedChat
          ? {
              ...c,
              status: 'Confirmed',
              messages: [
                ...c.messages,
                { from: 'me', text: `🤝 ${text('offerAccepted')} Pay locked at ${rupee(c.agreedPay)}.` },
              ],
            }
          : c
      )
    );
    setNotice(text('offerAccepted'));
  };

  // Mutual Phone Number Sharing
  const togglePhoneShare = () => {
    if (!selectedChat) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedChat
          ? {
              ...c,
              phoneShared: true,
              messages: [
                ...c.messages,
                { from: 'me', text: `📞 Phone number shared: ${profile.phone || '+91 98765 43210'}` },
              ],
            }
          : c
      )
    );
    setNotice(text('phoneShared'));
  };

  // Block & Report User
  const blockUser = () => {
    if (!selectedChat) return;
    const target = chats.find((c) => c.id === selectedChat);
    setChats((prev) => prev.filter((c) => c.id !== selectedChat));
    setSelectedChat(null);
    setNotice(`${target?.name || 'User'}: ${text('userBlocked')}`);
  };

  // Mark Work as Done & Pay
  const completeWorkAndPay = (payMethod) => {
    if (!selectedChat) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedChat
          ? {
              ...c,
              status: 'Completed',
              messages: [
                ...c.messages,
                { from: 'me', text: `✅ ${text('workDoneSuccess')} Paid via ${payMethod}.` },
              ],
            }
          : c
      )
    );
    setNotice(text('workDoneSuccess'));
    const active = chats.find((c) => c.id === selectedChat);
    setRatingModal({ name: active?.name || 'Worker', score: 5 });
  };

  // Submit Rating to API
  const submitRating = async () => {
    if (!ratingModal) return;
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workPostId: jobs[0]?.id || 'job-placeholder',
          reviewerId: user?.id || 'guest',
          revieweeId: jobs[0]?.posterId || 'worker-placeholder',
          stars: ratingModal.score || 5,
          comment: 'Great work and fair payment!',
        }),
      });
    } catch (e) {
      console.warn('Review save local fallback:', e);
    }
    setRatingModal(null);
    setNotice(text('ratingSaved'));
  };

  const getRadiusText = (km) => {
    if (km <= 15) return text('myArea');
    if (km <= 40) return locale === 'hi' ? 'मेरा शहर' : 'My city';
    return text('nearbyTowns');
  };

  // HEADER COMPONENT
  const header = (showLocation = false) => (
    <header className="topbar">
      <a
        className="brand"
        href="#home"
        onClick={(e) => {
          e.preventDefault();
          setTab('home');
          setScreen('home');
        }}
      >
        <span className="brand-mark">क</span>
        <span>
          kam<span className="brand-dot">.</span>
        </span>
      </a>

      {showLocation && (
        <button
          className="location-pill"
          onClick={() => {
            setTab('profile');
            setScreen('profile');
          }}
        >
          <Icon name="pin" size={16} />
          {profile.area.split(',')[0]}
          <span className="chevron">⌄</span>
        </button>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button className="sos-pill" onClick={triggerSOS} title="Emergency SOS alert">
          <Icon name="alert" size={15} />
          <span>SOS</span>
        </button>

        <button
          className="language-toggle"
          onClick={() => setLocale(locale === 'en' ? 'hi' : 'en')}
          aria-label={text('switchLanguage')}
        >
          <span className={locale === 'hi' ? 'language-active' : ''}>हिंदी</span>
          <span className="language-divider" />
          <span className={locale === 'en' ? 'language-active' : ''}>English</span>
        </button>
      </div>
    </header>
  );

  // NAVIGATION BAR
  const nav = () => (
    <nav className="bottom-nav" aria-label={text('navigation')}>
      {[
        ['home', 'home', 'navHome'],
        ['post', 'plus', 'navPost'],
        ['chat', 'chat', 'navChat'],
        ['friends', 'people', 'navFriends'],
        ['profile', 'user', 'navProfile'],
      ].map(([key, icon, label]) => (
        <button
          key={key}
          className={`nav-item ${tab === key ? 'nav-active' : ''}`}
          onClick={() => {
            setTab(key);
            setScreen(key);
            setSelectedChat(null);
          }}
          aria-current={tab === key ? 'page' : undefined}
        >
          <span className="nav-icon">
            <Icon name={icon} size={21} />
            {key === 'chat' && chats.some((c) => c.unread) && <i className="nav-dot" />}
          </span>
          <span>{text(label)}</span>
        </button>
      ))}
    </nav>
  );

  // JOB CARD COMPONENT
  const renderJobCard = (job) => {
    const authorName = job.poster?.name || 'Local Resident';
    const initials = authorName
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2);
    const cat = categories[job.category] || categories.other;
    const isPaidTime = job.category === 'companion';

    return (
      <article
        className="job-card"
        key={job.id}
        style={{ cursor: 'pointer' }}
        onClick={() => setSelectedJobDetail(job)}
      >
        <div className="job-person">
          <Avatar initials={initials} tone={cat.tone} />
          <div className="person-meta">
            <strong>{authorName}</strong>
            <span>
              {job.areaLabel || profile.area}{' '}
              <span className="meta-dot">·</span>{' '}
              {job.distance != null ? `${job.distance} km ${text('away')}` : text('nearYou')}
            </span>
          </div>
          <button
            className="read-button"
            aria-label={text('readAloud')}
            onClick={(e) => {
              e.stopPropagation();
              speak(
                `${job.title}. ${job.description || ''}. ${rupee(job.payAmount)} ${text(
                  `pay${(job.payType || 'day').toLowerCase()}`
                )}`
              );
            }}
          >
            <Icon name="speaker" size={19} />
          </button>
        </div>

        <div className="job-title-row">
          <span className="category-chip">
            {cat.icon} {text(`cat_${job.category}`)}
          </span>
          {isPaidTime && <span className="paid-time-badge">{text('paidTimeBadge')}</span>}
          {job.isUrgent && <span className="urgent-chip">{text('urgent')}</span>}
        </div>

        <h2>{job.title}</h2>
        {job.description && <p className="job-description">{job.description}</p>}

        <div className="job-footer">
          <span className="pay-amount">
            {rupee(job.payAmount)}
            <small>{text(`pay${(job.payType || 'day').toLowerCase()}`)}</small>
          </span>

          <button
            className="interest-button"
            onClick={(e) => {
              e.stopPropagation();
              openChat(authorName, job, job.poster?.phone);
            }}
          >
            {text('interested')} <span>↗</span>
          </button>
        </div>

        <div className="job-time">
          <span>{job.areaLabel || 'Local'}</span> · <span>⚡ {text('paymentChoice')}</span>
        </div>
      </article>
    );
  };

  // 1. HOME SCREEN
  const homeScreen = () => (
    <>
      {header(true)}
      <main className="main-content home-content">
        <section className="welcome">
          <div>
            <span className="eyebrow">{text('nearbyWork')}</span>
            <h1>
              {text('hello')}, {user?.name || profile.name} <span className="wave">✳</span>
            </h1>
            <p>{text('findWorkNearYou')}</p>
          </div>
          <div className="profile-progress">
            <div className="progress-ring">
              <span>{profile.skills.length ? '90%' : '50%'}</span>
            </div>
            <span>{text('profileReady')}</span>
          </div>
        </section>

        {/* Available Now Switch */}
        <button
          className="availability"
          onClick={() => setProfile((p) => ({ ...p, available: !p.available }))}
        >
          <span className={`availability-dot ${profile.available ? 'is-available' : ''}`} />
          <span>
            <strong>{text(profile.available ? 'availableNow' : 'notAvailable')}</strong>
            <small>{text('availabilityHint')}</small>
          </span>
          <span className={`switch ${profile.available ? 'switch-on' : ''}`}>
            <i />
          </span>
        </button>

        {/* Feed Type Switch: All Work vs Paid Hourly Time */}
        <div className="feed-type-tabs">
          <button
            className={`feed-tab ${feedFilter === 'all' ? 'active' : ''}`}
            onClick={() => setFeedFilter('all')}
          >
            🧰 {locale === 'hi' ? 'सभी काम (All Jobs)' : 'All Work'}
          </button>
          <button
            className={`feed-tab ${feedFilter === 'companion' ? 'active' : ''}`}
            onClick={() => setFeedFilter('companion')}
          >
            🤝 {text('paidTimeTitle')}
          </button>
        </div>

        {feedFilter === 'companion' && (
          <div className="paid-time-banner">
            <strong>🤝 {text('paidTimeBadge')}</strong>
            <p style={{ margin: '4px 0 0' }}>{text('paidTimeDesc')}</p>
            <small style={{ display: 'block', marginTop: '4px', fontWeight: 600 }}>
              🛡️ {text('safetyRules18')}
            </small>
          </div>
        )}

        {/* Search Bar with Speech-to-Text */}
        <section className="search-area">
          <div className="search-field">
            <Icon name="search" size={19} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={text('searchPlaceholder')}
              aria-label={text('searchPlaceholder')}
            />
            <button
              className="mic-button"
              onClick={() => voiceFill(setSearch)}
              aria-label={text('voiceSearch')}
            >
              <Icon name="mic" size={19} />
            </button>
          </div>
          <button
            className="filter-button"
            onClick={() => setNotice(`${text('workRadius')}: ${profile.radius} km`)}
          >
            ☷
          </button>
        </section>

        {/* Category Picker */}
        <section className="category-section">
          <div className="section-heading">
            <h2>{text('popularWork')}</h2>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSearch('');
              }}
            >
              {text('seeAll')}
            </button>
          </div>
          <div className="category-grid">
            {Object.entries(categories)
              .slice(0, 6)
              .map(([key, item]) => (
                <button
                  key={key}
                  className="category-item"
                  onClick={() => {
                    setSelectedCategory(selectedCategory === key ? null : key);
                    setSearch(selectedCategory === key ? '' : text(`cat_${key}`));
                  }}
                >
                  <span className={`category-icon ${item.tone}`}>{item.icon}</span>
                  <span>{text(`cat_${key}`)}</span>
                </button>
              ))}
          </div>
        </section>

        {/* Live Job Feed */}
        <section className="feed-section">
          <div className="section-heading">
            <div>
              <h2>{text('workAroundYou')}</h2>
              <span className="feed-subtitle">
                {filteredJobs.length} {text('jobsNearby')} (Within {profile.radius} km)
              </span>
            </div>
            <button className="sort-button" onClick={() => setNotice(text('nearestFirst'))}>
              ⌁ {text('nearest')}
            </button>
          </div>

          {loadingJobs ? (
            <p style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
              {text('pleaseWait')}
            </p>
          ) : filteredJobs.length > 0 ? (
            <div className="job-list">{filteredJobs.map(renderJobCard)}</div>
          ) : (
            <div className="empty-state">
              <span>🪴</span>
              <h3>{text('nothingNearby')}</h3>
              <p>{text('tryWiderRadius')}</p>
              <button
                className="outline-button"
                onClick={() =>
                  setProfile((prev) => ({
                    ...prev,
                    radius: Math.min(100, prev.radius + 15),
                  }))
                }
              >
                {text('widenRadius')} (+15 km)
              </button>
            </div>
          )}
        </section>

        {/* Safety Note & Location Share Bar */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button
            className="safety-note"
            style={{ flex: 1, margin: 0 }}
            onClick={() => setNotice(text('safetyDetails'))}
          >
            🛡️ <span>{text('safetyFirst')}</span>
            <span className="safety-link">{text('learnMore')} ↗</span>
          </button>
          <button
            className="btn-secondary"
            onClick={shareLiveLocation}
            title={text('shareLiveLocation')}
          >
            📍 {text('shareLiveLocation')}
          </button>
        </div>
      </main>
      {nav()}

      {/* JOB DETAIL MODAL */}
      {selectedJobDetail && (
        <div className="job-detail-backdrop" onClick={() => setSelectedJobDetail(null)}>
          <div className="job-detail-card" onClick={(e) => e.stopPropagation()}>
            <button className="job-detail-close" onClick={() => setSelectedJobDetail(null)}>
              ✕
            </button>

            <span className="eyebrow">{text('jobDetails')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="category-chip">
                {categories[selectedJobDetail.category]?.icon} {text(`cat_${selectedJobDetail.category}`)}
              </span>
              {selectedJobDetail.isUrgent && <span className="urgent-chip">{text('urgent')}</span>}
            </div>

            <h2 style={{ fontSize: '20px', margin: '4px 0' }}>{selectedJobDetail.title}</h2>
            <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              {selectedJobDetail.description || 'No extra description.'}
            </p>

            <div className="job-meta-grid">
              <div className="job-meta-item">
                <small>{text('payAmount')}</small>
                <strong style={{ color: 'var(--orange-dark)', fontSize: '16px' }}>
                  {rupee(selectedJobDetail.payAmount)} / {text(`pay${(selectedJobDetail.payType || 'day').toLowerCase()}`)}
                </strong>
              </div>
              <div className="job-meta-item">
                <small>{text('workLocation')}</small>
                <strong>{selectedJobDetail.areaLabel || profile.area}</strong>
              </div>
              <div className="job-meta-item">
                <small>{text('searchByDistance')}</small>
                <strong>{selectedJobDetail.distance != null ? `${selectedJobDetail.distance} km away` : 'Near you'}</strong>
              </div>
              <div className="job-meta-item">
                <small>{text('postedBy')}</small>
                <strong>{selectedJobDetail.poster?.name || 'Local Resident'}</strong>
              </div>
            </div>

            <div style={{ background: '#f0fdf4', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', color: '#166534' }}>
              🤝 <strong>{text('paymentChoice')}</strong>
            </div>

            <button
              className="primary-button"
              style={{ width: '100%', marginTop: '6px' }}
              onClick={() =>
                openChat(
                  selectedJobDetail.poster?.name || 'Local Resident',
                  selectedJobDetail,
                  selectedJobDetail.poster?.phone
                )
              }
            >
              💬 {text('interested')} ({text('hire')}) ↗
            </button>
          </div>
        </div>
      )}
    </>
  );

  // 2. POST WORK SCREEN
  const postScreen = () => (
    <>
      {header()}
      <main className="main-content page-content">
        <div className="page-heading">
          <span className="eyebrow">{text('yourNeighbourhood')}</span>
          <h1>{text('postWorkTitle')}</h1>
          <p>{text('postWorkSubtitle')}</p>
        </div>

        <form className="post-form" onSubmit={publishJob}>
          <label className="field-label">
            {text('whatWork')}
            <span>{text('chooseOne')}</span>
          </label>

          <div className="category-picker">
            {Object.entries(categories).map(([key, item]) => (
              <button
                type="button"
                key={key}
                className={`pick-category ${jobDraft.category === key ? 'picked' : ''}`}
                onClick={() => setJobDraft({ ...jobDraft, category: key })}
              >
                <span>{item.icon}</span>
                {text(`cat_${key}`)}
              </button>
            ))}
          </div>

          <label className="field-label" htmlFor="job-title">
            {text('shortTitle')}
          </label>
          <div className="input-with-action">
            <input
              id="job-title"
              maxLength={100}
              required
              value={jobDraft.title}
              onChange={(e) => setJobDraft({ ...jobDraft, title: e.target.value })}
              placeholder={text('titlePlaceholder')}
            />
            <button
              type="button"
              onClick={() => voiceFill((v) => setJobDraft((prev) => ({ ...prev, title: v })))}
              aria-label={text('voiceInput')}
            >
              <Icon name="mic" size={20} />
            </button>
          </div>

          <label className="field-label" htmlFor="job-details">
            {text('moreDetails')} <span>{text('optional')}</span>
          </label>
          <textarea
            id="job-details"
            rows={3}
            maxLength={500}
            value={jobDraft.details}
            onChange={(e) => setJobDraft({ ...jobDraft, details: e.target.value })}
            placeholder={text('detailsPlaceholder')}
          />
          <button
            className="voice-hint"
            type="button"
            onClick={() =>
              voiceFill((v) =>
                setJobDraft((prev) => ({
                  ...prev,
                  details: `${prev.details}${prev.details ? ' ' : ''}${v}`,
                }))
              )
            }
          >
            <Icon name="mic" size={17} /> {text('speakInstead')}
          </button>

          <div className="field-label">
            {text('yourOffer')} <span>{text('fairPayReminder')}</span>
          </div>
          <div className="pay-row">
            <span className="rupee-prefix">₹</span>
            <input
              aria-label={text('payAmount')}
              type="number"
              min="1"
              required
              value={jobDraft.pay}
              onChange={(e) => setJobDraft({ ...jobDraft, pay: e.target.value })}
              placeholder={text('amountPlaceholder')}
            />
            <select
              aria-label={text('payType')}
              value={jobDraft.payType}
              onChange={(e) => setJobDraft({ ...jobDraft, payType: e.target.value })}
            >
              <option value="hour">{text('payhour')}</option>
              <option value="day">{text('payday')}</option>
              <option value="job">{text('payjob')}</option>
            </select>
          </div>

          <div className="post-location">
            <span className="location-icon">
              <Icon name="pin" size={20} />
            </span>
            <span>
              <strong>{text('workLocation')}</strong>
              <small>{profile.area}</small>
            </span>
            <button
              type="button"
              onClick={() => {
                setTab('profile');
                setScreen('profile');
              }}
            >
              {text('change')}
            </button>
          </div>

          <button
            type="button"
            className={`urgent-toggle ${jobDraft.urgent ? 'urgent-selected' : ''}`}
            onClick={() => setJobDraft({ ...jobDraft, urgent: !jobDraft.urgent })}
          >
            <span>⚡</span>
            {text('markUrgent')}
            <span className="switch">
              <i />
            </span>
          </button>

          <p className="pay-choice-note">🤝 {text('paymentChoice')}</p>

          <button className="primary-button publish-button" type="submit" disabled={authBusy}>
            {authBusy ? text('pleaseWait') : text('publishWork')} <span>↗</span>
          </button>
        </form>
      </main>
      {nav()}
    </>
  );

  // 3. CHAT SCREEN (With Mutual Phone Share & Block/Report)
  const chatScreen = () => {
    const activeChat = chats.find((c) => c.id === selectedChat);

    if (activeChat) {
      return (
        <>
          {header()}
          <main className="main-content conversation-content">
            <button
              className="back-link"
              onClick={() => {
                setSelectedChat(null);
                setScreen('chat');
              }}
            >
              <Icon name="back" size={20} /> {text('allChats')}
            </button>

            <div className="conversation-person">
              <Avatar initials={activeChat.initials} tone="peach" />
              <div style={{ flex: 1 }}>
                <strong>{activeChat.name}</strong>
                <span>● {activeChat.status || text('nearbyMember')}</span>
              </div>
              <button
                style={{ fontSize: '12px', border: '1px solid #fecaca', background: '#fff1f2', color: '#e11d48', padding: '4px 8px', borderRadius: '6px' }}
                onClick={blockUser}
                title={text('blockUser')}
              >
                🛑 {text('blockUser')}
              </button>
            </div>

            {/* Negotiation & Counter Offer Banner */}
            <div className="negotiation-box">
              <div className="negotiation-row">
                <span>
                  <strong>Work:</strong> {activeChat.jobTitle}
                </span>
                <span className="pay-amount">{rupee(activeChat.agreedPay)}</span>
              </div>

              {activeChat.status !== 'Completed' ? (
                <>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <input
                      type="number"
                      placeholder="Enter counter price (₹)"
                      value={counterPrice}
                      onChange={(e) => setCounterPrice(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        fontSize: '12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        flex: 1,
                      }}
                    />
                    <button className="btn-secondary" onClick={sendCounterOffer}>
                      {text('makeOffer')}
                    </button>
                    <button className="btn-green-small" onClick={acceptOffer}>
                      ✓ {text('acceptOffer')}
                    </button>
                  </div>

                  <div className="action-buttons">
                    <button
                      className="btn-secondary"
                      onClick={() => completeWorkAndPay(text('payCash'))}
                    >
                      💵 {text('payCash')}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => completeWorkAndPay(text('payUPI'))}
                    >
                      📱 {text('payUPI')}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ color: '#16a34a', fontWeight: 700, fontSize: '13px' }}>
                  ✓ {text('completedWork')}
                </div>
              )}
            </div>

            {/* Mutual Phone Sharing Agreement (PRD Section 8) */}
            <div className="phone-agreement-box">
              <span>
                {activeChat.phoneShared ? (
                  <strong>📞 {activeChat.phone || '+91 98765 43211'}</strong>
                ) : (
                  <span>🔒 {text('phoneHidden')}</span>
                )}
              </span>
              {!activeChat.phoneShared && (
                <button
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={togglePhoneShare}
                >
                  {text('sharePhone')}
                </button>
              )}
            </div>

            {/* Message List */}
            <div className="message-list">
              {activeChat.messages.map((message, i) => (
                <div
                  className={`message ${message.from === 'me' ? 'message-mine' : ''}`}
                  key={i}
                >
                  {message.text}
                  <small>{message.from === 'me' ? text('you') : activeChat.name}</small>
                </div>
              ))}
            </div>

            {/* Quick Replies in Hindi / English */}
            <div className="quick-replies">
              <button onClick={() => setCurrentMessage(text('quickAddress'))}>
                {text('quickAddress')}
              </button>
              <button onClick={() => setCurrentMessage(text('quickWhen'))}>
                {text('quickWhen')}
              </button>
              <button onClick={() => setCurrentMessage(text('quickPay'))}>
                {text('quickPay')}
              </button>
            </div>

            {/* Message Input with Voice */}
            <form className="message-form" onSubmit={sendMessage}>
              <button
                type="button"
                onClick={() => voiceFill(setCurrentMessage)}
                aria-label={text('voiceNote')}
              >
                <Icon name="mic" size={21} />
              </button>
              <input
                name="message"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder={text('messagePlaceholder')}
                autoComplete="off"
              />
              <button className="send-button" aria-label={text('sendMessage')}>
                <Icon name="send" size={19} />
              </button>
            </form>
          </main>
          {nav()}
        </>
      );
    }

    return (
      <>
        {header()}
        <main className="main-content page-content">
          <div className="page-heading">
            <span className="eyebrow">{text('stayInTouch')}</span>
            <h1>{text('yourChats')}</h1>
            <p>{text('chatSubtitle')}</p>
          </div>

          <div className="chat-list">
            {chats.map((c) => (
              <button
                className="chat-row"
                key={c.id}
                onClick={() => {
                  setSelectedChat(c.id);
                  setChats((prev) =>
                    prev.map((item) => (item.id === c.id ? { ...item, unread: false } : item))
                  );
                }}
              >
                <Avatar initials={c.initials} tone="peach" />
                <span className="chat-row-info">
                  <strong>{c.name}</strong>
                  <small>{c.preview}</small>
                </span>
                <span className="chat-row-time">
                  {c.time}
                  {c.unread && <i />}
                </span>
              </button>
            ))}
          </div>

          <div className="chat-safety">🔒 {text('chatSafety')}</div>
        </main>
        {nav()}
      </>
    );
  };

  // 4. FIND WORKERS & COMMUNITY SCREEN (PRD Section 5 & 10)
  const friendsScreen = () => (
    <>
      {header()}
      <main className="main-content page-content">
        <div className="page-heading">
          <span className="eyebrow">{text('localCommunity')}</span>
          <h1>{text('findWorkersTitle')}</h1>
          <p>{text('findWorkersSubtitle')}</p>
        </div>

        {/* Tab switch: Skilled Workers vs Connections */}
        <div className="feed-type-tabs" style={{ marginBottom: '16px' }}>
          <button
            className={`feed-tab ${communitySubTab === 'workers' ? 'active' : ''}`}
            onClick={() => setCommunitySubTab('workers')}
          >
            🧰 {text('findWorkersTitle')}
          </button>
          <button
            className={`feed-tab ${communitySubTab === 'friends' ? 'active' : ''}`}
            onClick={() => setCommunitySubTab('friends')}
          >
            🤝 {text('friends')}
          </button>
        </div>

        {communitySubTab === 'workers' ? (
          <div>
            <div className="section-heading people-heading" style={{ margin: '0 0 12px' }}>
              <h2>{text('neighbours')}</h2>
              <span>{text('withinRadius', { radius: profile.radius })}</span>
            </div>

            {loadingWorkers ? (
              <p style={{ textAlign: 'center', padding: '20px' }}>{text('pleaseWait')}</p>
            ) : workers.length > 0 ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {workers.map((worker) => (
                  <div className="worker-card" key={worker.id}>
                    <div className="worker-card-header">
                      <Avatar
                        initials={(worker.name || 'W')
                          .split(' ')
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)}
                        tone="peach"
                      />
                      <div className="worker-details">
                        <strong style={{ fontSize: '15px' }}>{worker.name}</strong>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {worker.areaLabel} · {worker.distance} km {text('away')}
                        </span>
                        <div className="badges-row">
                          <span className="verified-badge">✓ {text('phoneVerified')}</span>
                          <span className="badge-gold">⭐ {worker.rating || 5.0} ({worker.reviewCount || 10})</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {worker.skills?.map((skill) => (
                        <span className="category-chip" key={skill}>
                          {categories[skill]?.icon} {text(`cat_${skill}`)}
                        </span>
                      ))}
                    </div>

                    <div className="worker-card-footer">
                      <span style={{ fontSize: '12px', color: '#475569' }}>
                        ⚡ {text('availableNow')}
                      </span>
                      <button
                        className="btn-primary-small"
                        onClick={() => openChat(worker.name, null, worker.phone)}
                      >
                        💬 {text('hire')} ↗
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', padding: '20px' }}>{text('nothingNearby')}</p>
            )}
          </div>
        ) : (
          <div>
            <div className="friend-highlight">
              <span>🤝</span>
              <div>
                <strong>{text('goodPeople')}</strong>
                <p>{text('goodPeopleHint')}</p>
              </div>
            </div>

            <div className="section-heading people-heading">
              <h2>{text('neighbours')}</h2>
              <span>{text('withinRadius', { radius: profile.radius })}</span>
            </div>

            {[
              { name: 'Sana Khan', initials: 'SK', job: 'cat_tutor', area: 'Domlur', rating: '4.9', tone: 'blue' },
              { name: 'Ravi Kumar', initials: 'RK', job: 'cat_carpenter', area: 'Indiranagar', rating: '4.8', tone: 'yellow' },
              { name: 'Lakshmi Devi', initials: 'LD', job: 'cat_cook', area: 'HAL 2nd Stage', rating: '5.0', tone: 'peach' },
            ].map((person) => (
              <div className="person-card" key={person.name}>
                <Avatar initials={person.initials} tone={person.tone} />
                <div className="person-card-info">
                  <strong>{person.name}</strong>
                  <span>
                    {text(person.job)} <i>·</i> {person.area}
                  </span>
                  <small>
                    ⭐ {person.rating} · <span className="verified-badge">✓ {text('phoneVerified')}</span>
                  </small>
                </div>
                <button
                  className="add-friend"
                  onClick={() => setNotice(text('requestSent'))}
                >
                  +
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          className="outline-button full-button"
          onClick={() => {
            setTab('home');
            setScreen('home');
          }}
        >
          {text('seeNearbyJobs')}
        </button>
      </main>
      {nav()}
    </>
  );

  // 5. PROFILE & MY JOBS SCREEN (PRD Section 4 & 13)
  const profileScreen = () => (
    <>
      {header()}
      <main className="main-content page-content">
        <div className="profile-banner">
          <div className="profile-banner-top">
            <Avatar
              initials={(user?.name || profile.name || 'K')
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)}
              tone="cream"
            />
            <button
              className="edit-profile"
              onClick={() => {
                const name = window.prompt(text('yourName'), user?.name || profile.name);
                if (name?.trim()) {
                  setProfile((prev) => ({ ...prev, name: name.trim() }));
                  if (user) setUser((prev) => ({ ...prev, name: name.trim() }));
                }
              }}
            >
              ✎ {text('edit')}
            </button>
          </div>

          <h1>{user?.name || profile.name}</h1>
          <p>
            <Icon name="pin" size={17} /> {profile.area}
          </p>
          <div className="profile-rating">
            <span className="verified-badge">✓ {text('phoneVerified')}</span>
            <span className="badge-gold">⭐ {profile.rating}</span>
            <span>{user?.phone || profile.phone}</span>
          </div>
        </div>

        {/* Work Radius Slider (5 km - 100 km) */}
        <section className="profile-section">
          <div className="section-heading">
            <h2>{text('workRadius')}</h2>
            <span className="radius-value">
              {profile.radius} km ({getRadiusText(profile.radius)})
            </span>
          </div>
          <input
            className="radius-slider"
            type="range"
            min="5"
            max="100"
            step="5"
            value={profile.radius}
            onChange={(e) => {
              const r = Number(e.target.value);
              setProfile((p) => ({ ...p, radius: r }));
            }}
            aria-label={text('workRadius')}
          />
          <div className="radius-ends">
            <span>5 km ({text('myArea')})</span>
            <span>100 km ({text('nearbyTowns')})</span>
          </div>
          <p className="helper-copy">{text('radiusExplanation')}</p>
        </section>

        {/* My Jobs Tracker (Posted / Applied / Completed) */}
        <section className="profile-section">
          <div className="section-heading">
            <h2>{text('myJobsTitle')}</h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className={`sort-button ${myJobsTab === 'posted' ? 'active' : ''}`}
                onClick={() => setMyJobsTab('posted')}
              >
                {text('tabPosted')} ({jobs.length})
              </button>
              <button
                className={`sort-button ${myJobsTab === 'applied' ? 'active' : ''}`}
                onClick={() => setMyJobsTab('applied')}
              >
                {text('tabApplied')} (1)
              </button>
              <button
                className={`sort-button ${myJobsTab === 'completed' ? 'active' : ''}`}
                onClick={() => setMyJobsTab('completed')}
              >
                {text('tabCompleted')} (2)
              </button>
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            {myJobsTab === 'posted' && (
              <div style={{ display: 'grid', gap: '8px' }}>
                {jobs.slice(0, 3).map((j) => (
                  <div
                    key={j.id}
                    style={{ background: 'white', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px' }}>{j.title}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{rupee(j.payAmount)} · {j.areaLabel}</div>
                    </div>
                    <span className="badge-gold">Active</span>
                  </div>
                ))}
              </div>
            )}
            {myJobsTab === 'applied' && (
              <div style={{ background: 'white', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <strong>Need help cleaning 2-BHK home</strong>
                <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px' }}>In Discussion with Meera Sharma</div>
              </div>
            )}
            {myJobsTab === 'completed' && (
              <div style={{ background: 'white', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <strong>Ceiling fan repair & switchboard fix</strong>
                <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>✓ Completed · Rated ⭐ 5.0</div>
              </div>
            )}
          </div>
        </section>

        {/* Skills Section */}
        <section className="profile-section">
          <div className="section-heading">
            <h2>{text('mySkills')}</h2>
            <button onClick={() => setSkillsOpen(!skillsOpen)}>
              {skillsOpen ? text('done') : `＋ ${text('add')}`}
            </button>
          </div>
          <div className="skill-list">
            {profile.skills.map((skill) => (
              <span className="skill-chip" key={skill}>
                {categories[skill]?.icon} {text(`cat_${skill}`)}
              </span>
            ))}
          </div>
          {skillsOpen && (
            <div className="category-picker skill-picker">
              {Object.entries(categories).map(([key, item]) => (
                <button
                  type="button"
                  key={key}
                  className={`pick-category ${profile.skills.includes(key) ? 'picked' : ''}`}
                  onClick={() =>
                    setProfile((p) => ({
                      ...p,
                      skills: p.skills.includes(key)
                        ? p.skills.filter((s) => s !== key)
                        : [...p.skills, key],
                    }))
                  }
                >
                  <span>{item.icon}</span>
                  {text(`cat_${key}`)}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Reviews Section */}
        <section className="profile-section ratings-section">
          <div className="section-heading">
            <h2>{text('yourReviews')}</h2>
            <button onClick={() => setRatingModal({ name: 'Meera Sharma', score: 5 })}>
              {text('rateSomeone')}
            </button>
          </div>
          <div className="review-row">
            <span>⭐ ⭐ ⭐ ⭐ ⭐</span>
            <strong>{text('meeraReview')}</strong>
            <small>{text('greatHelp')}</small>
          </div>
        </section>

        {/* Sign In / Out */}
        {user ? (
          <button className="settings-button" onClick={handleSignOut}>
            🔐 {text('signOut')} <span>›</span>
          </button>
        ) : (
          <button
            className="settings-button"
            onClick={() => {
              setAuthError('');
              setOtpSent(false);
              setOtp('');
              setTab('profile');
              setScreen('login');
            }}
          >
            🔐 {text('loginOtp')} <span>›</span>
          </button>
        )}

        <button className="help-link" onClick={() => setNotice(text('helpComingSoon'))}>
          {text('helpSupport')}
        </button>
      </main>
      {nav()}

      {/* Rating Modal */}
      {ratingModal && (
        <div className="modal-shade" onClick={() => setRatingModal(null)}>
          <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setRatingModal(null)}>
              <Icon name="close" />
            </button>
            <span className="eyebrow">{text('completedWork')}</span>
            <h2>{text('rateExperience', { name: ratingModal.name })}</h2>
            <div className="stars" role="group" aria-label={text('chooseRating')}>
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  type="button"
                  key={score}
                  className="star-button"
                  onClick={() => setRatingModal({ ...ratingModal, score })}
                >
                  {ratingModal.score >= score ? '★' : '☆'}
                </button>
              ))}
            </div>
            <button className="primary-button" onClick={submitRating}>
              {text('submitRating')}
            </button>
          </div>
        </div>
      )}
    </>
  );

  // 6. LOGIN WITH MOBILE + OTP SCREEN
  const loginScreen = () => (
    <>
      <main className="login-wrap">
        {header()}
        <div className="login-card">
          <span className="login-mark">क</span>
          <span className="eyebrow">{text('welcomeToKam')}</span>
          <h1>{otpSent ? text('enterOtp') : text('phoneLogin')}</h1>
          <p>{otpSent ? text('otpSent', { phone: otpPhone }) : text('phoneLoginHint')}</p>

          {!otpSent ? (
            <form onSubmit={handleRequestOtp}>
              <label className="field-label" htmlFor="phone">
                {text('mobileNumber')}
              </label>
              <input
                id="phone"
                className="input-field"
                type="tel"
                autoComplete="tel"
                required
                value={otpPhone}
                onChange={(e) => setOtpPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
              <button className="primary-button login-submit" disabled={authBusy}>
                {authBusy ? text('pleaseWait') : text('getOtp')} <span>↗</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <label className="field-label" htmlFor="otp">
                {text('otpCode')}
              </label>
              <input
                id="otp"
                className="input-field"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
              />
              <button className="primary-button login-submit" disabled={authBusy}>
                {authBusy ? text('pleaseWait') : text('verifyContinue')} <span>↗</span>
              </button>
              <button
                type="button"
                className="resend-button"
                disabled={authBusy}
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setAuthError('');
                }}
              >
                {text('changeNumber')}
              </button>
            </form>
          )}

          {authError && <p className="auth-error">{text(authError) || authError}</p>}
          <div className="login-privacy">🔒 {text('loginPrivacy')}</div>
        </div>
      </main>
      {nav()}
    </>
  );

  return (
    <div className="kam-app">
      <div className="app-shell">
        {screen === 'home' && homeScreen()}
        {screen === 'post' && postScreen()}
        {screen === 'chat' && chatScreen()}
        {screen === 'friends' && friendsScreen()}
        {screen === 'profile' && profileScreen()}
        {screen === 'login' && loginScreen()}
      </div>

      {notice && (
        <div className="toast" role="status">
          {notice}
          <button onClick={() => setNotice('')} aria-label={text('dismiss')}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
