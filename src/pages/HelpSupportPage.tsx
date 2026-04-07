import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, BookOpen, MessageSquare, Mail, HelpCircle, ExternalLink, Send, Bookmark, FileText, PenLine, Search, Bug, Lightbulb, MessageCircle, Palette, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── FAQ data ─────────────────────────────────────────────────────────── */
const faqs = [
  {
    q: 'How do I bookmark a verse?',
    a: 'Open any Surah, tap the three-dot menu (⋮) on a verse, then tap "Bookmark". Bookmarked verses appear in the Saved tab.',
  },
  {
    q: 'Can I change the Arabic font size?',
    a: 'Yes! Go to the Settings page (bottom navigation → Settings). You can independently adjust Arabic font size and translation font size.',
  },
  {
    q: 'What languages are supported for translations?',
    a: 'English, Bengali, and Hindi translations are currently supported. You can switch between them in Settings → Language.',
  },
  {
    q: 'How do I add a custom translation for a verse?',
    a: 'Inside a Surah, tap the three-dot menu on any verse and choose "Edit Translation". Your custom text is saved locally on your device.',
  },
  {
    q: 'What is the Library section?',
    a: 'The Library lets you browse and manage your Tafsir and Explanation notes all in one place, with search and filter capabilities.',
  },
  {
    q: 'Is my data stored online?',
    a: 'No. All your bookmarks, notes, Tafsirs, and custom translations are stored locally on your device using browser storage. Nothing is sent to any server.',
  },
];

/* ─── User Guides data ──────────────────────────────────────────────────── */
const guides = [
  {
    icon: <BookOpen size={20} className="text-primary" />,
    title: 'Reading a Surah',
    desc: 'Tap any Surah from the Home list to open it. Scroll through verses, adjust font sizes from Settings, and use the draggable pill on the right edge for quick navigation.',
  },
  {
    icon: <Palette size={20} className="text-primary" />,
    title: 'Tajweed Colors Guide',
    desc: 'Understand the different colors used in the Quran Arabic text to help you follow correct Tajweed pronunciation rules.',
    link: '/tajweed-guide'
  },
  {
    icon: <Bookmark size={20} className="text-primary" />,
    title: 'Bookmarks & Saved Verses',
    desc: 'Bookmark individual verses using the verse menu. All bookmarks are visible in the Saved tab, grouped by Surah.',
  },
  {
    icon: <FileText size={20} className="text-primary" />,
    title: 'Adding Tafsir & Explanations',
    desc: 'Open a verse menu and choose "Add Tafsirs" or "Add Explanation". The builder page lets you write rich notes with full formatting.',
  },
  {
    icon: <PenLine size={20} className="text-primary" />,
    title: 'Personal Notes',
    desc: 'Attach a personal note to any verse via the verse menu → "Add Note". Notes are searchable from the Library page.',
  },
  {
    icon: <Search size={20} className="text-primary" />,
    title: 'Searching',
    desc: 'Tap the search bar on the Home page to search across Surah names, verse text, and translations simultaneously.',
  },
];

/* ─── FAQ Accordion ─────────────────────────────────────────────────────── */
function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="border border-border rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <span className="font-medium text-[14px] text-foreground leading-snug">{q}</span>
        {open
          ? <ChevronUp size={16} className="shrink-0 text-primary" />
          : <ChevronDown size={16} className="shrink-0 text-muted-foreground" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="px-4 pb-4 text-[13px] text-muted-foreground leading-relaxed border-t border-border pt-3">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Section Heading ───────────────────────────────────────────────────── */
function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <h2 className="font-display font-semibold text-[16px] text-foreground">{title}</h2>
    </div>
  );
}

/* ─── Feedback form state ───────────────────────────────────────────────── */
type FeedbackType = 'bug' | 'suggestion' | 'other';

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function HelpSupportPage() {
  const navigate = useNavigate();
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) return;
    // In a real app this would POST to an endpoint; here we just show success
    setFeedbackSent(true);
    setFeedbackText('');
    setTimeout(() => setFeedbackSent(false), 4000);
  };

  return (
    <div className="min-h-screen pb-32 bg-background">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md pb-2 pt-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-b border-border/60 transform-gpu">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all text-foreground outline-none"
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-display text-xl font-semibold text-foreground flex-1">
            Help &amp; Support
          </h1>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-10">

        {/* ── FAQ ── */}
        <section>
          <SectionHeading icon={<HelpCircle size={16} />} title="Frequently Asked Questions" />
          <div className="space-y-2.5">
            {faqs.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} index={i} />
            ))}
          </div>
        </section>

        {/* ── User Guides ── */}
        <section>
          <SectionHeading icon={<BookOpen size={16} />} title="User Guides" />
          <div className="space-y-3">
            {guides.map((g, i) => (
              <motion.div
                key={i}
                onClick={() => {
                  if (g.link) navigate(g.link);
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className={`flex gap-3.5 p-4 rounded-2xl bg-card border border-border relative overflow-hidden ${g.link ? 'cursor-pointer hover:bg-secondary/20 transition-colors active:scale-[0.98]' : ''}`}
              >
                <div className="mt-0.5 shrink-0">{g.icon}</div>
                <div className="flex-1 pr-6">
                  <p className="font-semibold text-[13.5px] text-foreground mb-1">{g.title}</p>
                  <p className="text-[12.5px] text-muted-foreground leading-relaxed">{g.desc}</p>
                </div>
                {g.link && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50">
                    <ArrowRight size={16} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Report / Feedback ── */}
        <section>
          <SectionHeading icon={<MessageSquare size={16} />} title="Report or Feedback" />
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            {/* Type pills */}
            <div className="flex gap-2 flex-wrap">
              {(['bug', 'suggestion', 'other'] as FeedbackType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setFeedbackType(t)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                    feedbackType === t
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {t === 'bug' ? <Bug size={14} /> : t === 'suggestion' ? <Lightbulb size={14} /> : <MessageCircle size={14} />}
                  {t === 'bug' ? 'Report a bug' : t === 'suggestion' ? 'Suggestion' : 'Other'}
                </button>
              ))}
            </div>

            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder={
                feedbackType === 'bug'
                  ? 'Describe the bug and steps to reproduce it…'
                  : feedbackType === 'suggestion'
                  ? 'Share your idea or feature request…'
                  : "Write anything you'd like to share\u2026"
              }
              rows={4}
              className="w-full bg-muted/30 border border-border rounded-xl p-3.5 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
            />

            <AnimatePresence>
              {feedbackSent && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[12.5px] text-green-600 dark:text-green-400 font-medium"
                >
                  ✓ Thank you! Your feedback has been received.
                </motion.p>
              )}
            </AnimatePresence>

            <button
              onClick={handleSendFeedback}
              disabled={!feedbackText.trim()}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-[14px] transition-colors ${
                feedbackText.trim()
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
              }`}
            >
              <Send size={15} />
              Send Feedback
            </button>
          </div>
        </section>

        {/* ── Contact Us ── */}
        <section>
          <SectionHeading icon={<Mail size={16} />} title="Contact Us" />
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Have a specific question or need direct assistance? Reach us at:
            </p>
            <a
              href="mailto:support@insidequran.app"
              className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl group"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Mail size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-muted-foreground">Email support</p>
                <p className="text-[13.5px] font-medium text-primary truncate">support@insidequran.app</p>
              </div>
              <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
            <p className="text-[12px] text-muted-foreground">
              We typically respond within 1–2 business days.
            </p>
          </div>
        </section>

      </div>

      {/* ── Footer ── */}
      <div className="mt-12 px-4 pb-8 flex items-center justify-center gap-1 text-[11px] text-muted-foreground/70">
        <a
          href="/privacy-policy"
          className="hover:text-primary transition-colors underline underline-offset-2"
          onClick={e => { e.preventDefault(); alert('Privacy Policy — coming soon'); }}
        >
          Privacy Policy
        </a>
        <span className="mx-1 opacity-40">•</span>
        <a
          href="/terms"
          className="hover:text-primary transition-colors underline underline-offset-2"
          onClick={e => { e.preventDefault(); alert('Terms & Conditions — coming soon'); }}
        >
          Terms &amp; Conditions
        </a>
      </div>
    </div>
  );
}
