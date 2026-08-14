import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Paperclip, FileText, Camera, Mail, Package, Check, Circle } from 'lucide-react';
import HighlightText from './HighlightText';

export function getDynamicDocuments(kbEntry, entities = [], language = 'en') {
  const domain = kbEntry?.domain || 'consumer';
  const isHi = language === 'hi';

  const amountEnt = entities.find(e => e.entity_type === 'amount')?.entity_value || 'disputed amount';

  if (domain === 'tenant') {
    return [
      {
        id: 'agreement',
        title: isHi ? 'किराया समझौता / लीज डीड' : 'Rent / Lease Agreement',
        subtitle: isHi ? `किराया शर्तों और ${amountEnt} डिपॉजिट राशि का सबूत।` : `Proves tenancy terms and deposit amount (${amountEnt}).`,
        icon: FileText,
        available: true
      },
      {
        id: 'receipt',
        title: isHi ? 'बैंक ट्रांसफर / डिपॉजिट रसीद' : 'Bank Transfer / Deposit Receipt',
        subtitle: isHi ? 'मकान मालिक को भुगतान की गई सिक्योरिटी डिपॉजिट का सबूत।' : `Proof of deposit payment transferred (${amountEnt}).`,
        icon: FileText,
        available: true
      },
      {
        id: 'notice',
        title: isHi ? 'खाली करने का नोटिस / व्हाट्सएप चैट' : 'Vacating Notice / WhatsApp Chat',
        subtitle: isHi ? 'कमरा खाली करने और चाबी सौंपने की तारीख का सबूत।' : 'Proves notice of vacating and key handover date.',
        icon: Mail,
        available: true
      },
      {
        id: 'photos',
        title: isHi ? 'कमरे की स्थिति के फोटो / वीडियो' : 'Property Condition Photos / Video',
        subtitle: isHi ? 'यह साबित करने के लिए कि फ्लैट सही स्थिति में छोड़ा गया।' : 'Proof that property was left undamaged.',
        icon: Camera,
        available: false
      }
    ];
  } else if (domain === 'labour') {
    return [
      {
        id: 'offer',
        title: isHi ? 'नियुक्ति पत्र / रोजगार अनुबंध' : 'Employment Offer Letter / Contract',
        subtitle: isHi ? `मासिक वेतन (${amountEnt}) और पद साबित करता है।` : `Proves monthly salary (${amountEnt}) and job designation.`,
        icon: FileText,
        available: true
      },
      {
        id: 'slips',
        title: isHi ? 'वेतन पर्ची / बैंक विवरण' : 'Salary Slips / Bank Statement',
        subtitle: isHi ? 'बकाया अवधि के दौरान वेतन न मिलने का सबूत।' : 'Proves non-payment of salary for disputed period.',
        icon: FileText,
        available: true
      },
      {
        id: 'termination',
        title: isHi ? 'इस्तीफा / बर्खास्तगी ईमेल' : 'Resignation / Termination Email',
        subtitle: isHi ? 'अंतिम कार्य दिवस और पत्राचार का लिखित प्रमाण।' : 'Written proof of last working day & notice period.',
        icon: Mail,
        available: true
      },
      {
        id: 'attendance',
        title: isHi ? 'काम में उपस्थिति का रिकॉर्ड / एचआर चैट' : 'Work Attendance / HR Chat Logs',
        subtitle: isHi ? 'कंपनी में सक्रिय सेवा देने का प्रमाण।' : 'Proves active service rendered to employer.',
        icon: Package,
        available: false
      }
    ];
  } else if (domain === 'criminal') {
    return [
      {
        id: 'chat',
        title: isHi ? 'धमकी भरा कॉल रिकॉर्डिंग / व्हाट्सएप मैसेज' : 'Threat Call Recording / Message Logs',
        subtitle: isHi ? 'आपराधिक धमकी (BNS 351) का सीधा साक्ष्य।' : 'Direct evidence of criminal intimidation / threat.',
        icon: Mail,
        available: true
      },
      {
        id: 'complaint',
        title: isHi ? 'पुलिस स्टेशन शिकायत प्रति / जीडी प्रविष्टि' : 'Police Station GD / Written Complaint Copy',
        subtitle: isHi ? 'पुलिस को दी गई पूर्व सूचना की रसीद।' : 'Proof of prior intimation to local police station.',
        icon: FileText,
        available: true
      },
      {
        id: 'cctv',
        title: isHi ? 'सीसीटीवी फुटेज / गवाह का बयान' : 'CCTV Footage / Witness Statement',
        subtitle: isHi ? 'घटना का स्वतंत्र दृश्य या मौखिक साक्ष्य।' : 'Independent visual proof or third-party testimony.',
        icon: Camera,
        available: true
      },
      {
        id: 'medical',
        title: isHi ? 'मेडिकल / चोट रिपोर्ट' : 'Medical / Hospital Injury Certificate',
        subtitle: isHi ? 'शारीरिक हमले की स्थिति में डॉक्टर की रिपोर्ट।' : 'Medico-legal case record if physical harm occurred.',
        icon: FileText,
        available: false
      }
    ];
  } else if (domain === 'cybercrime') {
    return [
      {
        id: 'bank',
        title: isHi ? 'बैंक स्टेटमेंट / डेबिट मैसेज' : 'Bank Statement / UPI Debit SMS',
        subtitle: isHi ? `धोखाधड़ी वाली कटौती (${amountEnt}) और UTR नंबर का सबूत।` : `Proves unauthorized deduction of ${amountEnt} & UTR No.`,
        icon: FileText,
        available: true
      },
      {
        id: 'phishing',
        title: isHi ? 'नकली वेबसाइट लिंक / स्क्रीनशॉट' : 'Fake Scam Link / Phishing Screenshot',
        subtitle: isHi ? 'पहचान चुराने और धोखाधड़ी का तकनीकी साक्ष्य।' : 'Proof of deceptive personation under IT Act Sec 66D.',
        icon: Camera,
        available: true
      },
      {
        id: 'portal',
        title: isHi ? 'राष्ट्रीय साइबर अपराध पोर्टल (1930) पावती' : 'Cyber Crime Portal (1930) Acknowledgement',
        subtitle: isHi ? 'साइबर हेल्पलाइन 1930 पर दर्ज शिकायत नंबर।' : 'Official cybercrime helpline registration acknowledgement.',
        icon: Mail,
        available: true
      },
      {
        id: 'card',
        title: isHi ? 'बैंक चार्जबैक फॉर्म' : 'Bank Fraud Chargeback Form',
        subtitle: isHi ? 'बैंक को तुरंत सूचित करने की प्रति।' : 'Written chargeback request to issuing bank.',
        icon: Package,
        available: false
      }
    ];
  } else {
    // Default Consumer Case
    return [
      {
        id: 'invoice',
        title: isHi ? 'ऑर्डर टैक्स चालान / रसीद' : 'Order Tax Invoice / Bill',
        subtitle: isHi ? `खरीद राशि (${amountEnt}) और तिथि साबित करता है।` : `Proves purchase amount of ${amountEnt} and purchase date.`,
        icon: FileText,
        available: true
      },
      {
        id: 'photo',
        title: isHi ? 'खराब उत्पाद का फोटो / वीडियो' : 'Photos / Video Proof of Defect',
        subtitle: isHi ? 'सामान में खराबी का प्रत्यक्ष दृश्य प्रमाण।' : 'Visual proof of product defect upon arrival.',
        icon: Camera,
        available: true
      },
      {
        id: 'email',
        title: isHi ? 'ग्राहक सेवा इनकार ईमेल / चैट' : 'Customer Care Rejection Emails',
        subtitle: isHi ? 'दुकानदार या प्लेटफॉर्म द्वारा रिफंड से इनकार का सबूत।' : 'Proves seller or platform refused refund / replacement.',
        icon: Mail,
        available: true
      },
      {
        id: 'label',
        title: isHi ? 'कूरियर डिलीवरी लेबल / वारंटी कार्ड' : 'Delivery Box Label / Warranty Card',
        subtitle: isHi ? 'ट्रैकिंग स्टिकर और वैध वारंटी का सबूत।' : 'Box tracking sticker and valid warranty card.',
        icon: Package,
        available: false
      }
    ];
  }
}

export default function DocumentsHelpCard({ kbEntry, entities = [], language = 'en', enableHighlight = true }) {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    setDocuments(getDynamicDocuments(kbEntry, entities, language));
  }, [kbEntry, entities, language]);

  const isHi = language === 'hi';

  const title = isHi ? 'दस्तावेज़ जो मदद कर सकते हैं' : 'Documents that may help';
  const subtext = isHi 
    ? 'इन्हें इकट्ठा करने से आपका मामला और अधिक स्पष्ट और मजबूत बनता है।' 
    : 'Gathering these makes your case clearer and stronger.';
  const badgeNotice = isHi ? "सब कुछ नहीं है? कोई बात नहीं।" : "Don't have everything? That's okay.";

  const toggleDocumentStatus = (docId) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === docId) {
        return { ...doc, available: !doc.available };
      }
      return doc;
    }));
  };

  return (
    <motion.div 
      className="glass-card panel-card documents-help-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      {/* Card Header */}
      <div className="doc-help-header">
        <div className="doc-help-title-group">
          <div className="purple-paperclip-box">
            <Paperclip size={20} className="purple-paperclip-icon" />
          </div>
          <div>
            <h2 className="doc-help-title">{title}</h2>
            <p className="doc-help-subtext">{subtext}</p>
          </div>
        </div>
        <div className="dont-have-badge">
          <span>{badgeNotice}</span>
        </div>
      </div>

      {/* 2x2 Dynamic Grid of Document Cards */}
      <div className="doc-cards-grid">
        {documents.map((doc) => {
          const IconComponent = doc.icon;
          return (
            <motion.div
              key={doc.id}
              className={`doc-item-card ${doc.available ? 'is-available' : 'is-optional'}`}
              onClick={() => toggleDocumentStatus(doc.id)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="doc-card-top">
                <div className="doc-card-title-wrap">
                  <div className="doc-type-icon">
                    <IconComponent size={18} />
                  </div>
                  <span className="doc-card-title">{doc.title}</span>
                </div>

                <div className={`doc-status-pill ${doc.available ? 'pill-available' : 'pill-optional'}`}>
                  {doc.available ? (
                    <>
                      <Check size={12} className="pill-check" />
                      <span>{isHi ? '✓ उपलब्ध' : '✓ Available'}</span>
                    </>
                  ) : (
                    <>
                      <Circle size={10} className="pill-circle" />
                      <span>{isHi ? '◯ उपयोगी हो सकता है' : '◯ May be useful'}</span>
                    </>
                  )}
                </div>
              </div>

              <p className="doc-card-subtitle">
                <HighlightText text={doc.subtitle} enableHighlight={enableHighlight} />
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
