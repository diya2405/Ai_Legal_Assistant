import React from 'react';
import HighlightText from './HighlightText';

export default function FormattedText({ text, enableHighlight = true }) {
  if (!text) return null;
  
  const paragraphs = text.split('\n\n');
  return (
    <div className="formatted-text-wrapper">
      {paragraphs.map((para, pIdx) => {
        const parts = para.split(/(\*\*.*?\*\*)/g);
        const renderedParts = parts.map((part, idx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={idx} className="font-bold-highlight">
                <HighlightText text={part.slice(2, -2)} enableHighlight={enableHighlight} />
              </strong>
            );
          }
          return <HighlightText key={idx} text={part} enableHighlight={enableHighlight} />;
        });

        const isStep = para.startsWith('•') || para.startsWith('Step') || /^\d+\./.test(para);
        if (isStep) {
          return (
            <div key={pIdx} className="formatted-step-box">
              {renderedParts}
            </div>
          );
        }

        return (
          <p key={pIdx} className="formatted-paragraph">
            {renderedParts}
          </p>
        );
      })}
    </div>
  );
}
