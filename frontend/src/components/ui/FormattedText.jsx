import React from 'react';

export default function FormattedText({ text }) {
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
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
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
