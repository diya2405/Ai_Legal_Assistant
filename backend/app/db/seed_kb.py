from datetime import date
from app.db.database import SessionLocal, engine, Base
from app.db.models import KBEntry, StatuteChunk

def seed_data():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing entries
    db.query(KBEntry).delete()
    db.query(StatuteChunk).delete()
    db.commit()

    entries = [
        # --- 1. CONSUMER DISPUTES ---
        KBEntry(
            domain="consumer",
            issue_type="defective_product",
            law_code="N/A",
            act_name="Consumer Protection Act, 2019",
            section_number="Section 2(10) & Section 35",
            section_text_plain=(
                "Under Section 2(10) of the Consumer Protection Act, 2019, a 'defect' means any fault, "
                "imperfection or shortcoming in quality, quantity, potency, purity or standard required to be maintained. "
                "Under Section 35, an aggrieved consumer may file a formal complaint before the District Consumer Disputes "
                "Redressal Commission seeking replacement, repair, full refund, and monetary compensation for mental agony."
            ),
            plain_summary_seed=(
                "If a product you purchased is defective, damaged, or fails to work as promised, the seller and manufacturer "
                "are legally mandated under the Consumer Protection Act, 2019 to replace the item, issue a full refund, "
                "or repair the defect at zero cost."
            ),
            plain_summary_seed_hi=(
                "यदि आपके द्वारा खरीदा गया सामान खराब या दोषपूर्ण है, तो उपभोक्ता संरक्षण अधिनियम, 2019 के तहत विक्रेता और निर्माता "
                "उत्पाद को बदलने, पूरा पैसा वापस करने या बिना किसी अतिरिक्त शुल्क के मरम्मत करने के लिए कानूनी रूप से बाध्य हैं।"
            ),
            remedy_forum="District Consumer Disputes Redressal Commission (DCDRC)",
            limitation_period="2 years from cause of action",
            notice_template_id="consumer_notice",
            official_source_name="India Code - Dept of Consumer Affairs",
            source_url="https://www.indiacode.nic.in/handle/123456789/15256",
            last_verified_date=date(2024, 1, 15)
        ),
        KBEntry(
            domain="consumer",
            issue_type="unfair_trade_practice",
            law_code="N/A",
            act_name="Consumer Protection Act, 2019",
            section_number="Section 2(47) & Section 84",
            section_text_plain=(
                "Section 2(47) prohibits unfair trade practices including false representation of standards, charging above MRP, "
                "refusing cash receipts, or failing to issue tax invoices. Section 84 holds product sellers liable for deficiency."
            ),
            plain_summary_seed=(
                "Sellers cannot charge above printed MRP, refuse cash memo receipts, or mislead consumers with false claims. "
                "Doing so constitutes an unfair trade practice punishable under Indian Consumer Law."
            ),
            plain_summary_seed_hi=(
                "विक्रेता छपे हुए एमआरपी (MRP) से अधिक वसूल नहीं कर सकते और न ही रसीद देने से मना कर सकते हैं। "
                "ऐसा करना उपभोक्ता कानून के तहत गैर-कानूनी और दंडनीय है।"
            ),
            remedy_forum="District Consumer Disputes Redressal Commission",
            limitation_period="2 years from cause of action",
            notice_template_id="consumer_notice",
            official_source_name="National Consumer Helpline (NCH)",
            source_url="https://consumerhelpline.gov.in/",
            last_verified_date=date(2024, 1, 15)
        ),
        KBEntry(
            domain="consumer",
            issue_type="insurance_rejection",
            law_code="N/A",
            act_name="Insurance Act, 1938 & Consumer Protection Act, 2019",
            section_number="Insurance Act Sec 45 / CPA Sec 2(11)",
            section_text_plain=(
                "Arbitrary rejection of legitimate health, life, or motor insurance claims constitutes deficiency of service under CPA Section 2(11). "
                "Section 45 of Insurance Act mandates that no policy can be questioned after 3 years except on proven fraudulent non-disclosure."
            ),
            plain_summary_seed=(
                "Insurance companies cannot arbitrarily reject valid medical or hospitalization claims. "
                "You are entitled to full claim reimbursement along with interest and mental agony compensation through the Insurance Ombudsman or Consumer Forum."
            ),
            plain_summary_seed_hi=(
                "बीमा कंपनियां वैध स्वास्थ्य या अस्पताल के क्लेम को मनमाने ढंग से खारिज नहीं कर सकतीं। आप बीमा लोकपाल या उपभोक्ता फोरम से पूरे मुआवजे का दावा कर सकते हैं।"
            ),
            remedy_forum="Insurance Ombudsman / District Consumer Forum",
            limitation_period="1 year (Ombudsman) / 2 years (Consumer Court)",
            notice_template_id="insurance_notice",
            official_source_name="IRDAI - Insurance Regulatory Authority",
            source_url="https://irdai.gov.in/",
            last_verified_date=date(2024, 1, 15)
        ),

        # --- 2. TENANT DISPUTES ---
        KBEntry(
            domain="tenant",
            issue_type="deposit_not_returned",
            law_code="N/A",
            act_name="Model Tenancy Act, 2021",
            section_number="Section 10 & Section 13",
            section_text_plain=(
                "Under Sections 10 and 13 of the Model Tenancy Act, 2021, the landlord shall refund the security deposit "
                "to the tenant within one month of vacating the premises, after deducting legitimate dues/damages agreed upon in writing. "
                "Unreasonable withholding of deposit accrues statutory interest and penal damages."
            ),
            plain_summary_seed=(
                "Your landlord is legally obligated to return your security deposit within 30 days of vacating. "
                "They cannot make arbitrary deductions without providing bills or itemized proof of actual structural damages."
            ),
            plain_summary_seed_hi=(
                "मकान मालिक को कमरा खाली करने के 30 दिनों के भीतर आपकी सिक्योरिटी डिपॉजिट राशि वापस करनी होगी। "
                "वे वास्तविक नुकसान के सबूत के बिना कोई कटौती नहीं कर सकते।"
            ),
            remedy_forum="Rent Authority / Rent Court",
            limitation_period="3 years from vacating date",
            notice_template_id="tenant_deposit_notice",
            official_source_name="Ministry of Housing and Urban Affairs",
            source_url="https://mohua.gov.in/upload/uploadfiles/files/Model_Tenancy_Act_English.pdf",
            last_verified_date=date(2024, 1, 15)
        ),
        KBEntry(
            domain="tenant",
            issue_type="illegal_eviction",
            law_code="BNS",
            act_name="Model Tenancy Act, 2021 & Bharatiya Nyaya Sanhita, 2023",
            section_number="MTA Section 21 / BNS Section 329",
            section_text_plain=(
                "Section 21 of MTA mandates that no landlord shall evict a tenant without an explicit judicial order of the Rent Court. "
                "Cutting off essential services like water, power, or locking out a tenant violates MTA and constitutes Criminal Dispossession under BNS Section 329."
            ),
            plain_summary_seed=(
                "Landlords cannot forcibly evict you, change locks, or disconnect water/electricity without a formal eviction decree from the Rent Court."
            ),
            plain_summary_seed_hi=(
                "मकान मालिक बिना अदालती आदेश के आपको जबरन बाहर नहीं निकाल सकते, न ही पानी या बिजली की आपूर्ति काट सकते हैं।"
            ),
            remedy_forum="Rent Authority / Judicial Magistrate Court",
            limitation_period="30 days from threat or illegal lock-out",
            notice_template_id="tenant_eviction_notice",
            official_source_name="India Code - MTA & BNS 2023",
            source_url="https://www.indiacode.nic.in/",
            last_verified_date=date(2024, 1, 15)
        ),
        KBEntry(
            domain="tenant",
            issue_type="utility_disconnection",
            law_code="BNS",
            act_name="Model Tenancy Act, 2021",
            section_number="Section 22",
            section_text_plain=(
                "Under Section 22 of the Model Tenancy Act, 2021, no landlord shall cut off or withhold essential services "
                "such as electricity, water supply, or elevator access. The Rent Authority can order immediate restoration and levy heavy financial penalties on the landlord."
            ),
            plain_summary_seed=(
                "Disconnecting electricity or water to force a tenant out is strictly illegal. The Rent Authority can immediately restore utility connections and penalize the house owner."
            ),
            plain_summary_seed_hi=(
                "किराएदार को परेशान करने के लिए बिजली या पानी का कनेक्शन काटना गैर-कानूनी है। रेंट अथॉरिटी तुरंत कनेक्शन बहाल करने का आदेश दे सकती है।"
            ),
            remedy_forum="Rent Authority",
            limitation_period="Immediate / 7 days",
            notice_template_id="tenant_utility_notice",
            official_source_name="Ministry of Housing & Urban Affairs",
            source_url="https://mohua.gov.in/",
            last_verified_date=date(2024, 1, 15)
        ),

        # --- 3. LABOUR & EMPLOYMENT DISPUTES ---
        KBEntry(
            domain="labour",
            issue_type="unpaid_salary",
            law_code="N/A",
            act_name="Payment of Wages Act, 1936 & Code on Wages, 2019",
            section_number="Section 15 (Payment of Wages Act) & Section 18 (Code on Wages)",
            section_text_plain=(
                "Under Section 15 of the Payment of Wages Act and Section 18 of Code on Wages, wages must be paid before the 7th/10th day "
                "following the wage period. Delayed or withheld wages entitle the employee to claim full salary along with statutory compensation up to 10 times the amount."
            ),
            plain_summary_seed=(
                "Employers are statutory bound to release monthly salaries and full settlement dues on time. "
                "Unlawful withholding of earned wages gives you the right to recover full dues plus statutory penal compensation."
            ),
            plain_summary_seed_hi=(
                "नियोक्ता समय पर मासिक वेतन और अंतिम भुगतान जारी करने के लिए बाध्य हैं। "
                "वेतन रोकने पर आप पूरे बकाया और मुआवजे का दावा कर सकते हैं।"
            ),
            remedy_forum="Labour Commissioner / Industrial Tribunal",
            limitation_period="12 months from date salary became due",
            notice_template_id="labour_dues_notice",
            official_source_name="Ministry of Labour & Employment",
            source_url="https://labour.gov.in/wage-cell",
            last_verified_date=date(2024, 1, 15)
        ),
        KBEntry(
            domain="labour",
            issue_type="arbitrary_termination",
            law_code="N/A",
            act_name="Industrial Disputes Act, 1947 & State Shops & Establishments Act",
            section_number="Section 2A & Section 25F",
            section_text_plain=(
                "Under Section 25F of the Industrial Disputes Act, no workman shall be retrenched or terminated without 1 month written notice "
                "or wages in lieu of notice, plus retrenchment compensation equivalent to 15 days average pay for every completed year of service."
            ),
            plain_summary_seed=(
                "Arbitrary termination without mandatory notice pay or retrenchment compensation is illegal. "
                "Employees are entitled to notice pay, severance pay, and full settlement."
            ),
            plain_summary_seed_hi=(
                "बिना नोटिस अवधि वेतन या सेवरेंस के अवैध बर्खास्तगी गैर-कानूनी है।"
            ),
            remedy_forum="Labour Court / Conciliation Officer",
            limitation_period="1 year from termination date",
            notice_template_id="labour_dues_notice",
            official_source_name="Chief Labour Commissioner (Central)",
            source_url="https://clc.gov.in/",
            last_verified_date=date(2024, 1, 15)
        ),

        # --- 4. CRIMINAL THREATS & HARASSMENT ---
        KBEntry(
            domain="criminal",
            issue_type="physical_threat_harassment",
            law_code="BNS",
            act_name="Bharatiya Nyaya Sanhita, 2023 (BNS)",
            section_number="BNS Section 351 (Criminal Intimidation) & Section 308 (Extortion)",
            section_text_plain=(
                "Under Section 351 of BNS 2023, whoever threatens another with injury to their person, reputation, or property "
                "commits Criminal Intimidation punishable with imprisonment up to 2 years or fine or both. If the threat is to cause death or grievous hurt, punishment extends to 7 years."
            ),
            plain_summary_seed=(
                "Verbal, physical, or written threats of harm constitute Criminal Intimidation under BNS Section 351. "
                "You have the immediate right to lodge a formal police complaint for protection."
            ),
            plain_summary_seed_hi=(
                "किसी व्यक्ति को नुकसान पहुँचाने या धमकी देने का कृत्य बीएनएस धारा 351 के तहत आपराधिक धमकी है। "
                "आप सुरक्षा के लिए तुरंत पुलिस शिकायत दर्ज करा सकते हैं।"
            ),
            remedy_forum="Police Station / Judicial Magistrate Court (under BNSS Section 173)",
            limitation_period="3 years from date of threat",
            notice_template_id="police_complaint",
            official_source_name="Ministry of Home Affairs - BNS 2023 Gazette",
            source_url="https://www.mha.gov.in/en/commonpage/the-bharatiya-nyaya-sanhita-2023",
            last_verified_date=date(2024, 1, 15)
        ),

        # --- 5. CYBERCRIME & ONLINE FRAUD ---
        KBEntry(
            domain="cybercrime",
            issue_type="online_financial_phishing",
            law_code="IT Act & BNS",
            act_name="Information Technology Act, 2000 & BNS, 2023",
            section_number="IT Act Section 66D & BNS Section 318(4)",
            section_text_plain=(
                "Under Section 66D of the IT Act 2000, punishment for cheating by personation using computer resource or online communication "
                "includes imprisonment up to 3 years and fine up to Rs. 1 lakh. BNS Section 318(4) penalizes cheating causing wrongful loss."
            ),
            plain_summary_seed=(
                "Online financial fraud, phishing, fake website scams, or unauthorized bank/UPI transfers are cognizable offenses under IT Act Section 66D and BNS. "
                "Report immediately to National Cyber Crime Portal (1930)."
            ),
            plain_summary_seed_hi=(
                "ऑनलाइन वित्तीय धोखाधड़ी या यूपीआई फ्रॉड आईटी अधिनियम धारा 66D और बीएनएस के तहत संज्ञेय अपराध हैं।"
            ),
            remedy_forum="Cyber Crime Police Station / National Cyber Crime Reporting Portal (1930)",
            limitation_period="Immediate / 24 hours for bank chargeback",
            notice_template_id="cybercrime_complaint",
            official_source_name="National Cyber Crime Reporting Portal (MHA)",
            source_url="https://cybercrime.gov.in/",
            last_verified_date=date(2024, 1, 15)
        ),

        # --- 6. REAL ESTATE / PROPERTY DISPUTES ---
        KBEntry(
            domain="property",
            issue_type="builder_delay",
            law_code="RERA",
            act_name="Real Estate (Regulation and Development) Act, 2016 (RERA)",
            section_number="Section 18 & Section 19(4)",
            section_text_plain=(
                "Under Section 18 of RERA 2016, if the builder fails to complete or give possession of an apartment in accordance with the agreement for sale, "
                "they are liable to return the full amount received with interest at prescribed rates, or pay monthly interest compensation for every month of delay."
            ),
            plain_summary_seed=(
                "Builders cannot delay flat possession beyond the RERA agreed deadline. You are entitled to demand a full refund with interest or monthly compensation for possession delay."
            ),
            plain_summary_seed_hi=(
                "बिल्डर तय रेरा तारीख के बाद फ्लैट कब्जे में देरी नहीं कर सकते। आप ब्याज सहित पूरा रिफंड या मासिक देरी मुआवजे का दावा कर सकते हैं।"
            ),
            remedy_forum="State Real Estate Regulatory Authority (RERA) / Real Estate Appellate Tribunal",
            limitation_period="During period of ongoing delay",
            notice_template_id="rera_notice",
            official_source_name="Ministry of Housing & Urban Affairs - RERA",
            source_url="https://rera.mohua.gov.in/",
            last_verified_date=date(2024, 1, 15)
        ),

        # --- 7. FINANCIAL & CHEQUE BOUNCE ---
        KBEntry(
            domain="financial",
            issue_type="cheque_bounce",
            law_code="NI Act",
            act_name="Negotiable Instruments Act, 1881",
            section_number="Section 138 & Section 141",
            section_text_plain=(
                "Under Section 138 of NI Act, dishonour of a cheque due to insufficiency of funds or exceeding arrangements is a criminal offense "
                "punishable with imprisonment up to 2 years or fine up to twice the cheque amount. Mandatory 15-day demand notice is required prior to filing complaint."
            ),
            plain_summary_seed=(
                "If a cheque issued to you bounces due to insufficient funds, issuing a formal 15-day statutory notice under Section 138 NI Act obligates the drawer to pay or face criminal prosecution."
            ),
            plain_summary_seed_hi=(
                "यदि आपको दिया गया चेक बाउंस हो जाता है, तो धारा 138 एनआई एक्ट के तहत 15 दिनों का कानूनी नोटिस भेजकर आप दोगुनी राशि के आपराधिक मुकदमे का दावा कर सकते हैं।"
            ),
            remedy_forum="Metropolitan / Judicial Magistrate Court",
            limitation_period="30 days from receipt of bank memo to send notice; 30 days post notice expiry to file complaint",
            notice_template_id="cheque_bounce_notice",
            official_source_name="India Code - Negotiable Instruments Act",
            source_url="https://www.indiacode.nic.in/handle/123456789/2187",
            last_verified_date=date(2024, 1, 15)
        ),
        KBEntry(
            domain="financial",
            issue_type="cibil_harassment",
            law_code="CICRA",
            act_name="Credit Information Companies (Regulation) Act, 2005 & RBI Regulations",
            section_number="Section 15 & Section 21",
            section_text_plain=(
                "Reporting false loan defaults or failing to update credit records after loan closure violates Section 15 of CICRA 2005. "
                "Credit bureaus and banks must resolve credit record disputes within 30 days or pay statutory penalty compensation of Rs. 100 per day of delay under RBI directives."
            ),
            plain_summary_seed=(
                "Banks and credit bureaus are legally bound to correct erroneous CIBIL records within 30 days. Failure to rectify inaccurate default status entitles you to statutory daily compensation."
            ),
            plain_summary_seed_hi=(
                "बैंकों और सिबिल को 30 दिनों के भीतर गलत लोन डिफॉल्ट रिकॉर्ड को ठीक करना अनिवार्य है। देरी पर आप दैनिक मुआवजे के हकदार हैं।"
            ),
            remedy_forum="RBI Banking Ombudsman / Consumer Disputes Commission",
            limitation_period="30 days dispute notice",
            notice_template_id="cibil_notice",
            official_source_name="Reserve Bank of India (RBI)",
            source_url="https://cms.rbi.org.in/",
            last_verified_date=date(2024, 1, 15)
        ),

        # --- 8. MEDICAL NEGLIGENCE ---
        KBEntry(
            domain="medical",
            issue_type="medical_negligence",
            law_code="CPA & BNS",
            act_name="Consumer Protection Act, 2019 & Bharatiya Nyaya Sanhita, 2023",
            section_number="CPA Sec 2(11) / BNS Sec 106",
            section_text_plain=(
                "Gross medical negligence, surgical errors, or lack of reasonable professional care causing injury or death constitutes deficiency of medical service under CPA "
                "and criminal rashness under BNS Section 106. Patients are entitled to compensation for medical expenses, disability, and pain/suffering."
            ),
            plain_summary_seed=(
                "Hospitals and doctors are legally liable for gross surgical errors or negligence. You can file a claim for medical costs, impairment, and pain before the Consumer Court or State Medical Council."
            ),
            plain_summary_seed_hi=(
                "चिकित्सा लापरवाही या डॉक्टर की गलती के कारण हुए नुकसान के लिए अस्पताल और डॉक्टर कानूनी रूप से उत्तरदायी हैं। आप उपभोक्ता फोरम में मुआवजे का दावा कर सकते हैं।"
            ),
            remedy_forum="State / National Consumer Disputes Redressal Commission & State Medical Council",
            limitation_period="2 years from date of incident/discovery",
            notice_template_id="medical_negligence_notice",
            official_source_name="National Medical Commission (NMC)",
            source_url="https://www.nmc.org.in/",
            last_verified_date=date(2024, 1, 15)
        ),

        # --- 9. MOTOR VEHICLE ACCIDENT ---
        KBEntry(
            domain="accident",
            issue_type="mact_claim",
            law_code="MVA",
            act_name="Motor Vehicles Act, 1988 (as amended 2019)",
            section_number="Section 166 & Section 164",
            section_text_plain=(
                "Under Section 166 of Motor Vehicles Act, victims or legal heirs of road accident casualties caused by motor vehicles can claim full compensation "
                "for medical costs, loss of income, disability, and trauma before the Motor Accident Claims Tribunal (MACT)."
            ),
            plain_summary_seed=(
                "Road accident victims are statutory entitled to financial compensation for medical treatment, loss of earning capacity, and physical trauma from the vehicle owner's insurer."
            ),
            plain_summary_seed_hi=(
                "सड़क दुर्घटना के शिकार व्यक्ति या उनके परिजन दुर्घटना दावा ट्रिब्यूनल (MACT) के माध्यम से संपूर्ण इलाज खर्च और आय के नुकसान के मुआवजे का दावा कर सकते हैं।"
            ),
            remedy_forum="Motor Accident Claims Tribunal (MACT)",
            limitation_period="6 months from date of accident",
            notice_template_id="mact_claim_notice",
            official_source_name="Ministry of Road Transport and Highways",
            source_url="https://morth.nic.in/",
            last_verified_date=date(2024, 1, 15)
        ),

        # --- 10. INTELLECTUAL PROPERTY ---
        KBEntry(
            domain="intellectual_property",
            issue_type="trademark_infringement",
            law_code="IP",
            act_name="Trade Marks Act, 1999",
            section_number="Section 29 & Section 135",
            section_text_plain=(
                "Under Section 29 of Trade Marks Act 1999, unauthorized use of a registered trademark or deceptively similar logo in course of trade constitutes infringement. "
                "The trademark owner can seek permanent injunction, damages, account of profits, and destruction of counterfeit goods under Section 135."
            ),
            plain_summary_seed=(
                "Using your registered brand name, logo, or trademark without authorization is illegal. You have the right to seek court injunctions, seize counterfeit stock, and claim damages."
            ),
            plain_summary_seed_hi=(
                "आपके पंजीकृत ब्रांड लोगो या नाम का अनधिकृत उपयोग गैर-कानूनी है। आप अदालत से स्टे आर्डर (Injunction) और हर्जाने का दावा कर सकते हैं।"
            ),
            remedy_forum="Commercial Court / District Court",
            limitation_period="3 years from date of infringement knowledge",
            notice_template_id="trademark_notice",
            official_source_name="IP India - Controller General of Patents & Trademarks",
            source_url="https://ipindia.gov.in/",
            last_verified_date=date(2024, 1, 15)
        )
    ]

    for entry in entries:
        db.add(entry)
    db.commit()

    # Seed Statute Chunks for RAG Vector Search across all domains
    chunks = [
        StatuteChunk(
            act_name="Consumer Protection Act, 2019",
            section_number="Section 35",
            law_code="N/A",
            domain_hint="consumer",
            chunk_text="A complaint in relation to any goods sold or delivered or any service provided may be filed with a District Commission by the consumer for replacement, refund or compensation.",
            source_url="https://www.indiacode.nic.in/handle/123456789/15256"
        ),
        StatuteChunk(
            act_name="Model Tenancy Act, 2021",
            section_number="Section 10 & 13",
            law_code="N/A",
            domain_hint="tenant",
            chunk_text="Security deposit shall be refunded by landlord on vacating premises within 1 month. Arbitrary deduction is unlawful under MTA 2021.",
            source_url="https://mohua.gov.in/"
        ),
        StatuteChunk(
            act_name="Payment of Wages Act, 1936",
            section_number="Section 15",
            law_code="N/A",
            domain_hint="labour",
            chunk_text="Where contrary to provisions of this Act any deduction has been made from wages or payment delayed, worker may apply to authority for direction and up to 10x penalty compensation.",
            source_url="https://labour.gov.in/"
        ),
        StatuteChunk(
            act_name="Bharatiya Nyaya Sanhita, 2023",
            section_number="Section 351",
            law_code="BNS",
            domain_hint="criminal",
            chunk_text="Whoever threatens another with injury to person, reputation or property with intent to cause alarm commits criminal intimidation under BNS Section 351.",
            source_url="https://www.mha.gov.in/"
        ),
        StatuteChunk(
            act_name="Information Technology Act, 2000",
            section_number="Section 66D",
            law_code="IT Act",
            domain_hint="cybercrime",
            chunk_text="Cheating by personation using computer resource or online communication is punishable with imprisonment up to 3 years and fine up to 1 lakh rupees.",
            source_url="https://cybercrime.gov.in/"
        ),
        StatuteChunk(
            act_name="Real Estate (Regulation and Development) Act, 2016",
            section_number="Section 18",
            law_code="RERA",
            domain_hint="property",
            chunk_text="If promoter fails to complete or give possession of apartment in accordance with agreement, promoter shall return amount received with interest and compensation.",
            source_url="https://rera.mohua.gov.in/"
        ),
        StatuteChunk(
            act_name="Negotiable Instruments Act, 1881",
            section_number="Section 138",
            law_code="NI Act",
            domain_hint="financial",
            chunk_text="Dishonour of cheque for insufficiency of funds is offense punishable with imprisonment up to 2 years or fine up to twice the cheque amount.",
            source_url="https://www.indiacode.nic.in/"
        ),
        StatuteChunk(
            act_name="Credit Information Companies (Regulation) Act, 2005",
            section_number="Section 15",
            law_code="CICRA",
            domain_hint="financial",
            chunk_text="Failure to update credit records or reporting erroneous default must be resolved within 30 days subject to RBI daily penalty compensation.",
            source_url="https://cms.rbi.org.in/"
        ),
        StatuteChunk(
            act_name="Trade Marks Act, 1999",
            section_number="Section 29",
            law_code="IP",
            domain_hint="intellectual_property",
            chunk_text="Registered trademark infringement occurs when unauthorized person uses deceptively similar mark in course of trade. Injunction and damages available under Section 135.",
            source_url="https://ipindia.gov.in/"
        ),
        StatuteChunk(
            act_name="Motor Vehicles Act, 1988",
            section_number="Section 166",
            law_code="MVA",
            domain_hint="accident",
            chunk_text="Application for compensation arising out of accident involving motor vehicle may be made by victim or legal representatives to MACT tribunal.",
            source_url="https://morth.nic.in/"
        )
    ]

    for chunk in chunks:
        db.add(chunk)
    db.commit()
    db.close()
    print("Database successfully seeded with comprehensive multi-domain KB entries!")

if __name__ == "__main__":
    seed_data()
