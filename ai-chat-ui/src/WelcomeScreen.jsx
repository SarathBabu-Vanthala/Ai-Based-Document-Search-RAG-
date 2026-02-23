import { useState, useEffect } from "react";

const USE_CASES = [
  { id: "research", icon: "🔬", label: "Research", desc: "Academic papers, journals & reports" },
  { id: "business", icon: "💼", label: "Business", desc: "Contracts, proposals & analytics" },
  { id: "education", icon: "🎓", label: "Education", desc: "Textbooks, notes & study material" },
  { id: "personal", icon: "👤", label: "Personal", desc: "Personal docs, notes & files" },
];

const DOC_TYPES = [
  { id: "pdf", icon: "📄", label: "PDFs", desc: "PDF documents & reports" },
  { id: "word", icon: "📝", label: "Word Docs", desc: ".docx & .doc files" },
  { id: "mixed", icon: "📂", label: "Mixed", desc: "Multiple file formats" },
];

const FEATURES = [
  { icon: "⚡", text: "Instant answers from your documents" },
  { icon: "🔍", text: "Smart semantic search & retrieval" },
  { icon: "💬", text: "Natural conversational interface" },
  { icon: "🔒", text: "Your data stays private & secure" },
];

export default function WelcomeScreen({ onGetStarted }) {
  const [selectedUseCase, setSelectedUseCase] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [step, setStep] = useState(1); // 1 = welcome, 2 = configure
  const [visible, setVisible] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState([false, false, false, false]);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    setTimeout(() => setTitleVisible(true), 400);
    [0, 1, 2, 3].forEach((i) => {
      setTimeout(() => {
        setFeaturesVisible((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 700 + i * 150);
    });
  }, []);

  const canProceed = selectedUseCase && selectedDocType;

  const handleGetStarted = () => {
    if (step === 1) {
      setVisible(false);
      setTimeout(() => {
        setStep(2);
        setVisible(true);
      }, 400);
    } else if (canProceed) {
      onGetStarted?.({ useCase: selectedUseCase, docType: selectedDocType });
    }
  };

  return (
    <div style={styles.overlay}>
      {/* Animated background orbs */}
      <div style={styles.orb1} />
      <div style={styles.orb2} />
      <div style={styles.orb3} />

      <div
        style={{
          ...styles.card,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
      >
        {step === 1 ? (
          <>
            {/* Logo + Title */}
            <div style={styles.logoRow}>
              <div style={styles.logoIcon}>🧠</div>
            </div>

            <div
              style={{
                opacity: titleVisible ? 1 : 0,
                transform: titleVisible ? "translateY(0)" : "translateY(12px)",
                transition: "opacity 0.5s ease, transform 0.5s ease",
              }}
            >
              <h1 style={styles.title}>
                Welcome to{" "}
                <span style={styles.brand}>KnowledgeAI</span>
              </h1>
              <p style={styles.subtitle}>
                Your intelligent document companion — ask anything, get instant answers.
              </p>
            </div>

            {/* Divider */}
            <div style={styles.divider} />

            {/* Feature pills */}
            <div style={styles.featureGrid}>
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.featurePill,
                    opacity: featuresVisible[i] ? 1 : 0,
                    transform: featuresVisible[i] ? "translateY(0)" : "translateY(10px)",
                    transition: "opacity 0.4s ease, transform 0.4s ease",
                  }}
                >
                  <span style={styles.featureIcon}>{f.icon}</span>
                  <span style={styles.featureText}>{f.text}</span>
                </div>
              ))}
            </div>

            <button style={styles.primaryBtn} onClick={handleGetStarted}>
              Get Started →
            </button>
          </>
        ) : (
          <>
            <div style={styles.stepHeader}>
              <button style={styles.backBtn} onClick={() => { setVisible(false); setTimeout(() => { setStep(1); setVisible(true); }, 400); }}>
                ← Back
              </button>
              <div style={styles.stepIndicator}>
                <div style={{ ...styles.stepDot, background: "#7c3aed" }} />
                <div style={{ ...styles.stepDot, background: "#7c3aed" }} />
              </div>
            </div>

            <h2 style={styles.configTitle}>Let's personalize your experience</h2>
            <p style={styles.configSubtitle}>This helps KnowledgeAI tailor responses to your needs.</p>

            {/* Use Case */}
            <div style={styles.sectionLabel}>What will you use it for?</div>
            <div style={styles.optionGrid}>
              {USE_CASES.map((uc) => (
                <div
                  key={uc.id}
                  style={{
                    ...styles.optionCard,
                    ...(selectedUseCase === uc.id ? styles.optionCardSelected : {}),
                  }}
                  onClick={() => setSelectedUseCase(uc.id)}
                >
                  <span style={styles.optionIcon}>{uc.icon}</span>
                  <div>
                    <div style={styles.optionLabel}>{uc.label}</div>
                    <div style={styles.optionDesc}>{uc.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Doc Type */}
            <div style={{ ...styles.sectionLabel, marginTop: 24 }}>What type of documents?</div>
            <div style={styles.docGrid}>
              {DOC_TYPES.map((dt) => (
                <div
                  key={dt.id}
                  style={{
                    ...styles.docCard,
                    ...(selectedDocType === dt.id ? styles.optionCardSelected : {}),
                  }}
                  onClick={() => setSelectedDocType(dt.id)}
                >
                  <span style={styles.docIcon}>{dt.icon}</span>
                  <div style={styles.optionLabel}>{dt.label}</div>
                  <div style={styles.optionDesc}>{dt.desc}</div>
                </div>
              ))}
            </div>

            <button
              style={{
                ...styles.primaryBtn,
                marginTop: 28,
                opacity: canProceed ? 1 : 0.45,
                cursor: canProceed ? "pointer" : "not-allowed",
              }}
              onClick={handleGetStarted}
              disabled={!canProceed}
            >
              Launch KnowledgeAI 🚀
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "#0d0d1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    overflow: "hidden",
  },
  orb1: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)",
    top: "-100px",
    left: "-100px",
    animation: "float1 8s ease-in-out infinite",
    pointerEvents: "none",
  },
  orb2: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)",
    bottom: "-80px",
    right: "-80px",
    animation: "float2 10s ease-in-out infinite",
    pointerEvents: "none",
  },
  orb3: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)",
    top: "50%",
    left: "60%",
    animation: "float1 12s ease-in-out infinite reverse",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: "40px 44px",
    width: "100%",
    maxWidth: 560,
    boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.15)",
    backdropFilter: "blur(20px)",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  logoRow: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoIcon: {
    fontSize: 52,
    animation: "pulse 3s ease-in-out infinite",
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    color: "#ffffff",
    textAlign: "center",
    margin: "0 0 10px 0",
    letterSpacing: "-0.5px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  brand: {
    background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    margin: 0,
    lineHeight: 1.6,
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  divider: {
    height: 1,
    background: "rgba(255,255,255,0.07)",
    margin: "28px 0",
  },
  featureGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 32,
  },
  featurePill: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: "11px 16px",
  },
  featureIcon: {
    fontSize: 18,
    flexShrink: 0,
  },
  featureText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  primaryBtn: {
    width: "100%",
    padding: "14px 0",
    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.3px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },
  // Step 2
  stepHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    cursor: "pointer",
    padding: 0,
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  stepIndicator: {
    display: "flex",
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
  configTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#ffffff",
    margin: "0 0 8px 0",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  configSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.45)",
    margin: "0 0 24px 0",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(167,139,250,0.9)",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    marginBottom: 12,
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  optionGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  optionCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: "12px 16px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  optionCardSelected: {
    background: "rgba(124,58,237,0.15)",
    border: "1px solid rgba(124,58,237,0.5)",
    boxShadow: "0 0 0 1px rgba(124,58,237,0.2)",
  },
  optionIcon: {
    fontSize: 22,
    flexShrink: 0,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "#ffffff",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  optionDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    marginTop: 2,
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  docGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
  },
  docCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: "16px 10px",
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.2s ease",
  },
  docIcon: {
    fontSize: 26,
  },
};

// Inject keyframes once
if (typeof document !== "undefined" && !document.getElementById("welcome-keyframes")) {
  const style = document.createElement("style");
  style.id = "welcome-keyframes";
  style.innerHTML = `
    @keyframes float1 {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(30px, 20px); }
    }
    @keyframes float2 {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(-25px, -15px); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.08); }
    }
  `;
  document.head.appendChild(style);
}