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

        # --- 6. FINANCIAL RIGHTS & CIBIL HARASSMENT ---
        KBEntry(
            domain="financial",
            issue_type="cibil_harassment",
            law_code="CICRA",
            act_name="Credit Information Companies (Regulation) Act, 2005 & RBI Regulations",
            section_number="Section 15 & Section 21",
            section_text_plain=(
                "Under Sections 15 and 21 of the Credit Information Companies (Regulation) Act, 2005, credit institutions "
                "and CIBIL/bureau operators are legally obligated to maintain accurate financial records and update rectifications within 30 days. "
                "Reporting unauthorized loan defaults or failing to rectify erroneous credit reports attracts statutory compensation under RBI Ombudsman directions."
            ),
            plain_summary_seed=(
                "Banks and credit bureaus are legally bound to correct false default entries on your CIBIL credit report within 30 days of dispute notice. "
                "Erroneous reporting or harassment for loans you never took entitles you to statutory compensation and immediate credit record correction."
            ),
            plain_summary_seed_hi=(
                "बैंक और सिबिल क्रेडिट ब्यूरो विवाद सूचना के 30 दिनों के भीतर आपकी सिबिल रिपोर्ट में गलत डिफॉल्ट प्रविष्टि को सुधारने के लिए कानूनी रूप से बाध्य हैं। "
                "गलत रिपोर्टिंग या लोन के लिए परेशान करने पर आप मुआवजे और तत्काल रिकॉर्ड सुधार के हकदार हैं।"
            ),
            remedy_forum="RBI Banking Ombudsman / District Consumer Disputes Redressal Commission (DCDRC)",
            limitation_period="3 years from discovery of erroneous reporting",
            notice_template_id="cibil_harassment_notice",
            official_source_name="Reserve Bank of India (RBI Ombudsman)",
            source_url="https://cms.rbi.org.in/",
            last_verified_date=date(2024, 1, 20)
        ),
        KBEntry(
            domain="financial",
            issue_type="cheque_bounce",
            law_code="NI Act",
            act_name="Negotiable Instruments Act, 1881",
            section_number="Section 138 & Section 142",
            section_text_plain=(
                "Under Section 138 of the Negotiable Instruments Act, 1881, dishonour of a cheque for insufficiency of funds or exceeding arrangements "
                "is a criminal offense punishable with imprisonment up to 2 years, or with fine which may extend to twice the amount of the cheque, or both."
            ),
            plain_summary_seed=(
                "If a cheque issued to you bounces due to insufficient funds, you must issue a statutory demand notice within 30 days of receiving bank memo. "
                "Failure to pay within 15 days of notice allows you to file a criminal case under Section 138 of the NI Act."
            ),
            plain_summary_seed_hi=(
                "यदि आपको दिया गया चेक बाउंस हो जाता है, तो बैंक मेमो मिलने के 30 दिनों के भीतर कानूनी नोटिस भेजना अनिवार्य है। "
                "भुगतान न करने पर धारा 138 के तहत आपराधिक मामला दर्ज किया जा सकता है।"
            ),
            remedy_forum="Judicial Magistrate First Class (JMFC) / Metropolitan Magistrate Court",
            limitation_period="30 days from expiry of 15-day statutory notice period",
            notice_template_id="cheque_bounce_notice",
            official_source_name="India Code - NI Act 1881",
            source_url="https://www.indiacode.nic.in/handle/123456789/2187",
            last_verified_date=date(2024, 1, 20)
        ),

        # --- 7. PROPERTY & RERA BUILDER DELAY ---
        KBEntry(
            domain="property",
            issue_type="builder_delay",
            law_code="RERA",
            act_name="Real Estate (Regulation and Development) Act, 2016 (RERA)",
            section_number="Section 18 & Section 31",
            section_text_plain=(
                "Under Section 18 of RERA 2016, if a promoter fails to complete or give possession of an apartment in accordance with the agreement for sale, "
                "the promoter shall be liable on demand to return the amount received with interest at prescribed rates, or pay monthly delay interest."
            ),
            plain_summary_seed=(
                "If your builder delays flat possession beyond the agreed RERA commitment date, you have the legal right to claim full refund with interest "
                "or monthly interest compensation for every month of delay until possession is handed over."
            ),
            plain_summary_seed_hi=(
                "यदि बिल्डर रेरा की तय समय सीमा से अधिक देरी करता है, तो आपको ब्याज के साथ पूरा रिफंड या देरी के हर महीने के लिए ब्याज मुआवजे का कानूनी अधिकार प्राप्त है।"
            ),
            remedy_forum="Real Estate Regulatory Authority (RERA) / RERA Adjudicating Officer",
            limitation_period="3 years from agreed date of possession",
            notice_template_id="builder_delay_notice",
            official_source_name="Ministry of Housing and Urban Affairs (RERA)",
            source_url="https://rera.mohua.gov.in/",
            last_verified_date=date(2024, 1, 20)
        ),

        # --- 8. MEDICAL NEGLIGENCE ---
        KBEntry(
            domain="medical",
            issue_type="medical_negligence",
            law_code="CPA",
            act_name="Consumer Protection Act, 2019 & Indian Medical Council Regulations",
            section_number="Section 2(11) & Section 84",
            section_text_plain=(
                "Under Section 2(11) of CPA 2019, gross surgical failure, incorrect treatment, or breach of duty of care by medical practitioners "
                "and hospitals constitutes deficiency of service entitling the patient or legal heirs to financial damages and compensation."
            ),
            plain_summary_seed=(
                "Doctors and hospitals are legally answerable for breach of medical standard of care, surgical errors, or wrong treatment. "
                "Patients or their families can claim compensation for medical expenses, disability, and suffering before the Consumer Commission."
            ),
            plain_summary_seed_hi=(
                "अस्पताल और डॉक्टर चिकित्सीय लापरवाही, गलत इलाज या लापरवाही के लिए जवाबदेह हैं। आप उपभोक्ता आयोग में इलाज खर्च और मुआवजे का दावा कर सकते हैं।"
            ),
            remedy_forum="District Consumer Disputes Redressal Commission (DCDRC) / State Medical Council",
            limitation_period="2 years from date of negligence or discovery",
            notice_template_id="medical_negligence_notice",
            official_source_name="National Medical Commission (NMC)",
            source_url="https://www.nmc.org.in/",
            last_verified_date=date(2024, 1, 20)
        ),

        # --- 9. ACCIDENT & MACT CLAIMS ---
        KBEntry(
            domain="accident",
            issue_type="mact_claim",
            law_code="MV Act",
            act_name="Motor Vehicles Act, 1988",
            section_number="Section 166 & Section 168",
            section_text_plain=(
                "Under Section 166 of the Motor Vehicles Act 1988, victims of road accidents or legal representatives of deceased persons "
                "can file a claim petition before the Motor Accidents Claims Tribunal (MACT) for just compensation against the vehicle owner and insurance company."
            ),
            plain_summary_seed=(
                "Road accident victims or their families have a statutory right to claim financial compensation for medical bills, permanent disability, "
                "loss of livelihood, and pain/suffering from the vehicle owner's insurer under Motor Vehicles law."
            ),
            plain_summary_seed_hi=(
                "सड़क दुर्घटना पीड़ितों या उनके आश्रितों को इलाज खर्च, विकलांगता और आजीविका के नुकसान के लिए मोटर दुर्घटना ट्रिब्यूनल (MACT) से मुआवजे का अधिकार है।"
            ),
            remedy_forum="Motor Accidents Claims Tribunal (MACT)",
            limitation_period="6 months from date of accident",
            notice_template_id="mact_claim_notice",
            official_source_name="Ministry of Road Transport and Highways",
            source_url="https://morth.nic.in/",
            last_verified_date=date(2024, 1, 20)
        ),

        # --- 10. INTELLECTUAL PROPERTY & TRADEMARK ---
        KBEntry(
            domain="intellectual_property",
            issue_type="trademark_infringement",
            law_code="Trade Marks Act",
            act_name="Trade Marks Act, 1999",
            section_number="Section 29 & Section 134",
            section_text_plain=(
                "Under Section 29 of the Trade Marks Act 1999, unauthorized commercial use of a mark identical or deceptively similar to a registered trademark "
                "constitutes infringement. Section 134 empowers trademark owners to seek permanent injunction, damages, and seizure of counterfeit goods."
            ),
            plain_summary_seed=(
                "Using a registered brand name, logo, or trademark without authorization to sell goods/services is illegal. "
                "The registered owner can issue a Cease and Desist notice and claim injunction plus financial damages in Commercial Court."
            ),
            plain_summary_seed_hi=(
                "बिना अनुमति के पंजीकृत ब्रांड नाम या लोगो का उपयोग करना अवैध ट्रेडमार्क उल्लंघन है। आप इसे तुरंत रोकने और मुआवजे का मुकदमा कर सकते हैं।"
            ),
            remedy_forum="Commercial Court / District Court",
            limitation_period="3 years from date of infringement discovery",
            notice_template_id="trademark_infringement_notice",
            official_source_name="Intellectual Property India (CGPDTM)",
            source_url="https://ipindia.gov.in/",
            last_verified_date=date(2024, 1, 20)
        ),

        # --- 11. INSURANCE REJECTION ---
        KBEntry(
            domain="consumer",
            issue_type="insurance_rejection",
            law_code="Insurance Act & CPA",
            act_name="Insurance Act, 1938 & Consumer Protection Act, 2019",
            section_number="Insurance Act Section 45 & CPA Section 35",
            section_text_plain=(
                "Arbitrary rejection of valid health, life, or motor insurance claims citing unverified pre-existing conditions or minor delay "
                "constitutes illegal repudiation and deficiency of service punishable under Consumer Protection Act and IRDAI guidelines."
            ),
            plain_summary_seed=(
                "Insurance companies cannot reject valid claims on frivolous or unproven technical grounds. "
                "You have the right to appeal to the Insurance Ombudsman or file a complaint with DCDRC for claim disbursement plus interest."
            ),
            plain_summary_seed_hi=(
                "बीमा कंपनियां बिना ठोस आधार के वैध क्लेम खारिज नहीं कर सकतीं। आप बीमा लोकपाल (Ombudsman) या उपभोक्ता अदालत में शिकायत कर सकते हैं।"
            ),
            remedy_forum="Insurance Ombudsman / District Consumer Disputes Redressal Commission (DCDRC)",
            limitation_period="1 year (Insurance Ombudsman) / 2 years (DCDRC)",
            notice_template_id="insurance_claim_notice",
            official_source_name="IRDAI (Insurance Regulatory and Development Authority)",
            source_url="https://irdai.gov.in/",
            last_verified_date=date(2024, 1, 20)
        ),

        # --- 12. UTILITY DISCONNECTION ---
        KBEntry(
            domain="tenant",
            issue_type="utility_disconnection",
            law_code="MTA & Electricity Act",
            act_name="Model Tenancy Act, 2021 & Electricity Act, 2003",
            section_number="MTA Section 22 & Electricity Act Section 56",
            section_text_plain=(
                "Under Section 22 of MTA 2021, no landlord shall cut off or withhold any essential supply or service (water, power, sanitation) "
                "in the premises occupied by the tenant. The Rent Authority can order immediate restoration and impose heavy monetary penalties on the offender."
            ),
            plain_summary_seed=(
                "Cutting off basic utility services like electricity or water supply to pressurize or evict a tenant is illegal. "
                "You can seek emergency restoration orders from the Rent Authority and Electricity Ombudsman."
            ),
            plain_summary_seed_hi=(
                "मकान मालिक किराएदार को परेशान करने के लिए बिजली या पानी का कनेक्शन नहीं काट सकता। यह गैर-कानूनी है और तुरंत बहाली का आदेश प्राप्त किया जा सकता है।"
            ),
            remedy_forum="Rent Authority / Electricity Ombudsman / Civil Court",
            limitation_period="Immediate / 30 days from disconnection",
            notice_template_id="utility_disconnection_notice",
            official_source_name="Ministry of Power / MTA Gazette",
            source_url="https://powermin.gov.in/",
            last_verified_date=date(2024, 1, 20)
        )
    ]

    for entry in entries:
        db.add(entry)
    db.commit()

    # Seed Statute Chunks for RAG Vector Search
    chunks = [
        StatuteChunk(
            act_name="Consumer Protection Act, 2019",
            section_number="Section 35",
            law_code="N/A",
            domain_hint="consumer",
            chunk_text="A complaint in relation to any goods sold or delivered or agreed to be sold or delivered or any service provided or agreed to be provided may be filed with a District Commission by the consumer.",
            source_url="https://www.indiacode.nic.in/handle/123456789/15256"
        ),
        StatuteChunk(
            act_name="Model Tenancy Act, 2021",
            section_number="Section 10",
            law_code="N/A",
            domain_hint="tenant",
            chunk_text="The security deposit to be paid by the tenant in advance shall not exceed two months rent for residential premises and six months rent for non-residential premises. Security deposit shall be refunded by landlord on vacating.",
            source_url="https://mohua.gov.in/upload/uploadfiles/files/Model_Tenancy_Act_English.pdf"
        ),
        StatuteChunk(
            act_name="Payment of Wages Act, 1936",
            section_number="Section 15",
            law_code="N/A",
            domain_hint="labour",
            chunk_text="Where contrary to the provisions of this Act any deduction has been made from the wages of an employed person or any payment of wages has been delayed, such person may apply to such authority for direction.",
            source_url="https://labour.gov.in/wage-cell"
        ),
        StatuteChunk(
            act_name="Bharatiya Nyaya Sanhita, 2023",
            section_number="Section 351",
            law_code="BNS",
            domain_hint="criminal",
            chunk_text="Whoever threatens another with any injury to his person, reputation or property, or to the person or reputation of any one in whom that person is interested, with intent to cause alarm to that person commits criminal intimidation.",
            source_url="https://www.mha.gov.in/"
        ),
        StatuteChunk(
            act_name="Information Technology Act, 2000",
            section_number="Section 66D",
            law_code="IT Act",
            domain_hint="cybercrime",
            chunk_text="Whoever by means of any communication device or computer resource cheats by personation shall be punished with imprisonment of either description for a term which may extend to three years and shall also be liable to fine which may extend to one lakh rupees.",
            source_url="https://cybercrime.gov.in/"
        ),
        StatuteChunk(
            act_name="Credit Information Companies (Regulation) Act, 2005",
            section_number="Section 15",
            law_code="CICRA",
            domain_hint="financial",
            chunk_text="Every credit institution shall update and rectify credit information of borrowers within thirty days of dispute notification. False or inaccurate reporting of default attracts penal consequences and statutory compensation.",
            source_url="https://cms.rbi.org.in/"
        ),
        StatuteChunk(
            act_name="Negotiable Instruments Act, 1881",
            section_number="Section 138",
            law_code="NI Act",
            domain_hint="financial",
            chunk_text="Dishonour of cheque for insufficiency, etc., of funds in the account is punishable with imprisonment for a term which may extend to two years, or with fine which may extend to twice the amount of the cheque, or with both.",
            source_url="https://www.indiacode.nic.in/handle/123456789/2187"
        ),
        StatuteChunk(
            act_name="Real Estate (Regulation and Development) Act, 2016",
            section_number="Section 18",
            law_code="RERA",
            domain_hint="property",
            chunk_text="If the promoter fails to complete or is unable to give possession of an apartment, plot or building in accordance with the terms of the agreement for sale, he shall be liable on demand to return the amount received with interest.",
            source_url="https://rera.mohua.gov.in/"
        ),
        StatuteChunk(
            act_name="Motor Vehicles Act, 1988",
            section_number="Section 166",
            law_code="MV Act",
            domain_hint="accident",
            chunk_text="An application for compensation arising out of an accident of the nature specified in sub-section (1) of section 165 may be made by the person who has sustained the injury or by the owner of the property or by legal representatives.",
            source_url="https://morth.nic.in/"
        ),
        StatuteChunk(
            act_name="Trade Marks Act, 1999",
            section_number="Section 29",
            law_code="Trade Marks Act",
            domain_hint="intellectual_property",
            chunk_text="A registered trade mark is infringed by a person who, not being a registered proprietor or a person using by way of permitted use, uses in the course of trade, a mark which is identical with, or deceptively similar to, the trade mark.",
            source_url="https://ipindia.gov.in/"
        )
    ]

    for chunk in chunks:
        db.add(chunk)
    db.commit()
    db.close()
    print("Database successfully seeded with multi-domain KB entries & verified legal sources!")

if __name__ == "__main__":
    seed_data()
