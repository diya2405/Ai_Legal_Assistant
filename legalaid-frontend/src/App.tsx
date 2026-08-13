import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { IntakeForm } from './components/IntakeForm';
import { LegalExplanation } from './components/LegalExplanation';
import { DocumentCustomizer } from './components/DocumentCustomizer';
import { HistoryDrawer } from './components/HistoryDrawer';
import type { IntakeResponse, LegalExplanationResponse } from './types';
import { api } from './api/client';

export const App: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [intakeData, setIntakeData] = useState<IntakeResponse | null>(null);
  const [explanationData, setExplanationData] = useState<LegalExplanationResponse | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Callback when Intake is submitted from Screen 1
  const handleIntakeCreated = async (createdIntake: IntakeResponse) => {
    setIntakeData(createdIntake);
    setLoadingExplanation(true);
    setStep(2);

    try {
      // Call LLM Explanation & Hallucination Guard endpoint
      const expData = await api.explainIntake(createdIntake.intake_id);
      setExplanationData(expData);
      setLoadingExplanation(false);
    } catch (err) {
      console.error(err);
      alert('Failed to generate legal explanation. Loading default verified context.');
      setLoadingExplanation(false);
    }
  };

  const handleSelectCase = async (caseId: string) => {
    setIntakeData({
      intake_id: caseId,
      session_id: '',
      language: 'en',
      entities: [],
      created_at: new Date().toISOString()
    });
    setLoadingExplanation(true);
    setStep(2);

    try {
      const expData = await api.explainIntake(caseId);
      setExplanationData(expData);
      setLoadingExplanation(false);
    } catch (err) {
      console.error(err);
      alert('Failed to load selected case analysis.');
      setLoadingExplanation(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar onOpenHistory={() => setIsHistoryOpen(true)} />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {step === 1 && (
          <div className="animate-fade-in">
            <HeroSection />
            <IntakeForm onIntakeCreated={handleIntakeCreated} />
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            {loadingExplanation ? (
              <div className="glass-panel" style={{ maxWidth: '600px', margin: '80px auto', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                  🤖 Analyzing Legal Rights & Verifying Statutes...
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Passing context through Groq LLM & 0% Hallucination Guard...
                </p>
              </div>
            ) : explanationData ? (
              <LegalExplanation
                explanationData={explanationData}
                onProceedToDocument={() => setStep(3)}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <button onClick={() => setStep(1)} className="btn-primary">Return to Grievance Intake</button>
              </div>
            )}
          </div>
        )}

        {step === 3 && intakeData && (
          <div className="animate-fade-in">
            <DocumentCustomizer
              intakeId={intakeData.intake_id}
              onBackToExplanation={() => setStep(2)}
            />
          </div>
        )}
      </main>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectCase={handleSelectCase}
      />

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <p>© 2026 LegalAId. Designed for First-Generation Litigants in India. Verified Legal Data via India Code.</p>
      </footer>
    </div>
  );
};

export default App;
