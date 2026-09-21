#!/usr/bin/env python3
"""
Merge the first batch of confirmed 2026 speakers (headshots + bios collected in
"2026 Website Speakers/") into data/speakers.json.

- Returning speakers (already in speakers.json from 2024/2025) are updated in
  place: bio/title/company/photo/linkedin refreshed to their 2026 info, and
  "2026" is appended to their `year` field.
- New speakers are appended as new entries with year "2026".
- All 15 records get a `featured2026` flag (used for the homepage teaser) and
  an `order2026` value (used to sort the dedicated 2026 speakers page).

Only speakers with both a bio AND a headshot ready are included in this batch.
(Ben Hoffman, Michelle Bowman, and Spencer Cox are invited but have not yet
submitted a bio/photo, so they're intentionally left out for now.)
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JSON_PATH = ROOT / "data" / "speakers.json"

SPEAKERS_2026 = [
    {
        "name": "John Sun",
        "title": "CEO and Co-Founder",
        "company": "Spring Labs",
        "photo": "images/2026-john-sun.jpg",
        "linkedin": "https://www.linkedin.com/in/avantjohnsun/",
        "bio": "John is the Founder and CEO of Spring Labs, the first fully agentic AI conversational intelligence platform built for financial institutions. Spring Labs partners with leading banks, sponsor banks, and fintechs to help them deeply understand and act on what customers are telling them at scale. The company also hosts the annual AI-Native Banking & Fintech Conference in Salt Lake City. Before founding Spring Labs, John spent his career building tech-forward consumer fintechs. He was an early employee and Head of Analytics at Enova (NYSE: CSH), and later co-founded Avant, where he served as Chief Risk Officer. He is a Y Combinator S11 alum and has been recognized for his pioneering work in fintech by Inc.'s 30 Under 30 and Crain's Chicago Business 40 Under 40.",
        "order2026": 1,
        "featured2026": True,
    },
    {
        "name": "Mike Hsu",
        "title": "Fellow and Former Acting Comptroller of the Currency",
        "company": "Cambridge Judge Business School",
        "photo": "images/2026-mike-hsu.jpg",
        "linkedin": "https://www.linkedin.com/in/michael-hsu-992257347",
        "bio": "Michael J. Hsu served as Acting Comptroller of the Currency (OCC) from May 2021 to February 2025. There he also served as a Director of the FDIC and member of the Financial Stability Oversight Council. Mike has worked at the Federal Reserve, Securities and Exchange Commission, U.S. Treasury Department, and IMF. Currently, he is co-chair of the ML Commons Financial Services Working Group, a fellow at the University of Cambridge Judge Business School and the Aspen Institute, Executive Advisor to FINOS, board member of the Financial Health Network, venture partner at Core Innovation Capital, and advisor to a range of companies, startups, and central banks. He researches and writes on AI in financial services and financial regulation and supervision.",
        "order2026": 2,
        "featured2026": True,
    },
    {
        "name": "Howard Headlee",
        "title": "President & CEO",
        "company": "Utah Bankers Association",
        "photo": "images/2026-howard-headlee.jpg",
        "linkedin": "https://www.linkedin.com/in/howard-headlee-50a72a6/",
        "bio": "Mr. Headlee was appointed President and Chief Executive Officer of the Utah Bankers Association, April 1997. The Utah Bankers Association is a trade association serving the banking industry in the state of Utah, the 4th largest banking state in the U.S. Its membership consists of state and nationally chartered banks, savings banks and FDIC insured industrial banks. Mr. Headlee has been recognized as one of Utah's 100 most influential people. As leader of the UBA, Mr. Headlee created the Regulatory Feedback Initiative, a nationwide program to collect feedback on bank examinations in order to introduce transparency and accountability into the bank examination process. He also launched the industry's first \"Super PAC\" Friends of Traditional Banking designed to organize and focus independent personal political contributions from across the U.S. into key Congressional races. Mr. Headlee was elected by his peers to serve as Chairman of the National Alliance of Bankers Associations and served in that role during the COVID pandemic where he helped direct the banking industry's response to the pandemic, including the roll out of the Paycheck Protection Program (PPP.) Mr. Headlee is passionate about public education. He founded one of the largest charter public schools in Utah and in 2012, he was appointed by Utah Governor Gary Herbert to serve on the Utah State Charter School Board where he served as Chairman until he retired in 2016. He now serves on the advisory board for the Center for the School of the Future. Mr. Headlee also served as Chairman and founder of Utah Center for Neighborhood Stabilization. He received his Bachelor of Science from the Brigham Young University School of Accountancy and earned a Master of Business Administration from the University of Utah. Howard is a member of the Tabernacle Choir on Temple Square and he and his wife Tana have six children and live in Sandy, Utah.",
        "order2026": 3,
        "featured2026": True,
    },
    {
        "name": "Alex Johnson",
        "title": "Founder",
        "company": "Fintech Takes",
        "photo": "images/2026-alex-johnson.jpg",
        "linkedin": "https://www.linkedin.com/in/alexhjohnson/",
        "bio": "Alex Johnson is the founder of Fintech Takes, a media brand focused on the intersection of finance, technology, and public policy.",
        "order2026": 4,
        "featured2026": True,
    },
    {
        "name": "Phil Goldfeder",
        "title": "CEO",
        "company": "American Fintech Council",
        "photo": "images/2026-phil-goldfeder.jpg",
        "linkedin": "https://www.linkedin.com/in/philgoldfeder/",
        "bio": "With nearly two decades of experience at the intersection of the public and private sectors, Phil Goldfeder currently serves as Chief Executive Officer of the American Fintech Council (AFC), a leading industry association representing responsible financial technology (fintech) companies creating critical access to safe and affordable financial services. AFC, comprised of the nation's largest fintech companies, fosters innovative, transparent, and responsible products that promote competition, consumer protection, and financial health, inclusion, and equity. Before joining AFC, Goldfeder served as Senior Vice President of Global Public Affairs at Cross River, a financial institution and technology infrastructure provider. He helped lead Cross River to provide more than $12 billion in PPP funding to small businesses during the COVID-19 pandemic. He previously served as an elected member of the New York State Assembly representing diverse neighborhoods of Queens, N.Y., and as a senior advisor to Senate Majority Leader Chuck Schumer and New York City Mayor Michael Bloomberg. He is an active industry leader engaging policymakers and regulators, and is frequently invited to speak at conferences globally on banking, technology, financial literacy, and the new financial services landscape.",
        "order2026": 5,
        "featured2026": True,
    },
    {
        "name": "Peter Renton",
        "title": "CEO and Founder",
        "company": "Renton & Co",
        "photo": "images/2026-peter-renton.jpeg",
        "linkedin": "https://www.linkedin.com/in/peterrenton/",
        "bio": "Peter Renton is the CEO of Renton & Co, LLC, a consulting firm specializing in fintech media, events and thought leadership. He was formerly the co-founder and chairman of Fintech Nexus, a fintech media and events company that produced 31 large-scale events worldwide. The events business was sold to Fintech Meetup in 2023 and the media business was sold to COMMAND, a PR firm, in 2024. Since July 2024, Peter has been an independent fintech media and events consultant, working with select fintech startups and helping to produce 5+ small events a year. Peter has been writing about fintech since 2010, with over 2,500 articles published. He is the author and creator of the Fintech One-on-One Podcast, the first and longest-running fintech interview series, with almost 600 episodes. Over the last decade, Peter has also conducted more than 750 live interviews and panel discussions and produced over 1,800 fintech newsletters.",
        "order2026": 6,
        "featured2026": True,
    },
    {
        "name": "Jeff Currier",
        "title": "Chief Technology Officer",
        "company": "Chime",
        "photo": "images/2026-jeff-currier.jpg",
        "linkedin": "https://www.linkedin.com/in/jeff-currier/",
        "bio": "Jeff Currier is chief technology officer at Chime, responsible for leading the company's engineering organization and driving innovation, product velocity, and technical excellence. Jeff joined Chime from Galileo Financial Technologies, a SoFi company, where he was chief technology officer and led the company's transformation to the cloud. Prior to Galileo, he was vice president of engineering at SoFi, where he led development of the SoFi Money product. Jeff also held engineering leadership roles at Amazon Web Services, Twitter where he introduced consumer and live video to the service, and Microsoft, where he was a founding member of the Azure SQL Database team and launched the Azure platform. Jeff holds a B.S. in computer science from the University of Michigan.",
        "order2026": 7,
        "featured2026": False,
    },
    {
        "name": "Karin Lockovitch",
        "title": "Partner, Head of Retail Banking and Consumer Compliance",
        "company": "Oliver Wyman",
        "photo": "images/2026-karin-lockovitch.jpg",
        "linkedin": "https://www.linkedin.com/in/karin-hill-lockovitch-5386aa183/",
        "bio": "Karin Lockovitch is a 25-year banking and financial services risk and compliance executive. Karin is a Partner and Head of Oliver Wyman's Retail Banking Regulatory practice, and is based in Salt Lake City, Utah. Karin provides advisory services for banks, non-bank lenders and insurance providers, fintechs, and de-novo bank/banks-in-formation, where she advises on the design, build, and maturity of enterprise risk and compliance programs, bank charter applications and the design and build of de-novo institutions, and regulatory supervision and enforcement dynamics across the financial services industry. Prior to joining Oliver Wyman, Karin held positions as the Chief Risk and Chief Compliance Officer for several banks and non-banks, including Chief Risk Officer for loanDepot, Executive Vice President and Chief Compliance Officer for Bank of the West and Zions Bancorporation and the Senior Vice President and Chief Compliance Officer for SunTrust's (now Truist) Consumer and Small Business division. Karin has deep experience working with all U.S. regulatory agencies, having experienced many significant regulatory changes and events through her career, including leading the implementation of notable regulatory changes and the remediation of major enforcement actions. She has led and advised large risk and compliance organizations through the build and maturity of Enterprise Risk and Compliance programs (issue management, regulatory change management, third-party risk, risk assessment, monitoring and testing) and governance frameworks, Consumer Protection and Fair and Responsible Banking programs, Customer Complaint programs, Community Reinvestment Act programs, Anti-Money Laundering programs, Employee Ethics and Integrity programs, Privacy and Reg O/Reg W programs, and the implementation and adoption of the line of defense model. Karin regularly speaks, facilitates webinars and roundtables, and provides thought leadership on banking regulatory compliance and risk topics. Through her career she has chaired and served on many risk and compliance committees through the Consumer Bankers Association, the American Bankers Association, the Mortgage Bankers Association, the Risk Management Association, and the Conference of State Bank Supervisors. She served as a U.S. banking delegate to the Basel Committee's Supervision and Implementation Group (SIG) 2018 workshop on risk governance and culture, non-financial risk management and operationalization of the line of defense model. Most recently, she lead the annual Chief Compliance Officer Survey sponsored by Oliver Wyman and the Risk Management Association and has written and spoken on regulatory, compliance and risk management topics. Karin holds an MBA from the University of Utah and a BA from the University of Massachusetts. She is a Certified Regulatory Compliance Manager (CRCM).",
        "order2026": 8,
        "featured2026": False,
    },
    {
        "name": "Aaron Kouhoupt",
        "title": "Partner",
        "company": "Womble Bond Dickinson (US) LLP",
        "photo": "images/2026-aaron-kouhoupt.jpg",
        "linkedin": "https://www.linkedin.com/in/aaron-kouhoupt-a92a6184",
        "bio": "Aaron Kouhoupt has held a range of legal and compliance roles within banks and FinTech companies, providing him with direct experience in the operational and regulatory issues faced by financial services clients. His work includes applying existing legal frameworks to new financial products, building and operating bank compliance programs, and assisting foreign companies with launching U.S. banking and consumer finance products. His practice focuses on helping clients address legal requirements while taking business objectives into account. He regularly advises FinTech clients on regulatory compliance in the context of innovative products and services. Aaron has more than 20 years of experience as both in-house and outside counsel to banks, FinTechs, and other financial institutions of varying sizes and structures. He represents marketplace lenders and other FinTech companies, as well as community, regional, and national banks, small loan companies, mortgage lenders and servicers, money transmitters, and payments processors. He advises clients on regulatory compliance matters involving consumer loan documentation, e-commerce, underwriting, and advertising. A significant portion of his practice involves counseling both bank and non-bank participants in bank partnership arrangements. Aaron also advises on traditional banking and consumer finance matters, including issues arising under the Bank Secrecy Act (BSA), the Fair Debt Collection Practices Act (FDCPA), and the Fair Credit Reporting Act (FCRA), as well as on privacy, bankruptcy, and enterprise risk management. Aaron has worked extensively with regulatory regimes applicable to emerging financial products. He previously served as Head of Legal at an alternative banking and digital payments company and held in-house roles at a peer-to-peer lending and alternative investing company. He also advises European companies seeking to launch consumer finance products in the United States.",
        "order2026": 9,
        "featured2026": False,
    },
    {
        "name": "Carey Ransom",
        "title": "Managing Director",
        "company": "BankTech Ventures",
        "photo": "images/2026-carey-ransom.jpg",
        "linkedin": "https://www.linkedin.com/in/careyransom",
        "bio": "Carey Ransom is the Managing Director of BankTech Ventures, a $150MM strategic investment and market intelligence firm focused on transformative solutions to make community banks better. He and his team currently work with over 130 banks and 30 companies aligned to the future of banking. He's a serial tech entrepreneur and investor who also founded Operate to invest in data-centric software companies. Prior roles include CPO at Experian, CEO of RealPractice, and CMO at Happy Money. His career also spans product, marketing, and business development leadership roles. His belief in purpose, culture, and teamwork stems from growing up in his family's 100 year-old retail business.",
        "order2026": 10,
        "featured2026": False,
    },
    {
        "name": "Kim Gerhardt",
        "title": "Founder",
        "company": "The FinTech Interactive",
        "photo": "images/2026-kim-gerhardt.jpg",
        "linkedin": "https://www.linkedin.com/in/kimg1/",
        "bio": "Kim Gerhardt is Founder of The FinTech Interactive, where she advises a portfolio of companies redefining how lenders see and serve consumer and small business borrowers to accelerate access to fair and responsible financial services. Kim's focus: the data and tech infrastructure that actually expands credit access, rather than just automating the status quo. She works at the frontier of governed small business credit data, credit risk scoring, alternative data and cash flow underwriting, merchant fraud, and data connectivity. Her work also extends to fair lending and AI validation, supporting her clients as they build small business lending infrastructure that's smarter, faster, and fairer.",
        "order2026": 11,
        "featured2026": False,
    },
    {
        "name": "Marc Rehberger",
        "title": "Principal Advisor",
        "company": "Anvil & Forge Advisory",
        "photo": "images/2026-marc-rehberger.jpg",
        "linkedin": "https://www.linkedin.com/in/rehberger/",
        "bio": "Marc Rehberger is the Principal Advisor at Anvil & Forge Advisory, an advisory practice for banks, fintechs, and founders. He has spent 15 years in banks, VC-backed fintechs, and proptechs, and has built and deployed AI systems inside regulated financial institutions. His practice rests on one premise: anyone can deploy AI, very few people can make it work. Marc lives in Idaho with his high school sweetheart, Rose, who is a real-life flower farmer. Marc holds a Bachelor of Science in Business Management from Pepperdine University.",
        "order2026": 12,
        "featured2026": False,
    },
    {
        "name": "Mike Failor",
        "title": "Chief Risk Officer",
        "company": "ByzFunder",
        "photo": "images/2026-mike-failor.jpg",
        "linkedin": "https://www.linkedin.com/in/michaelfailor/",
        "bio": "Mike Failor is a Chief Risk Officer with more than 20 years of executive leadership experience helping financial technology companies grow responsibly through disciplined risk management, analytics, and innovation. Today, he leads enterprise credit risk, fraud, underwriting, analytics, and governance at ByzFunder, where he's building an AI-native enterprise risk organization that combines experienced risk professionals with specialized AI to transform business intelligence, forecasting, governance, and executive decision support. Previously, he served as Chief Credit Officer at CNG Holdings and spent more than a decade at Enova International, helping scale multi-billion-dollar lending portfolios, launch new products, build strategic bank partnerships, and develop data-driven risk organizations that consistently improved profitability and portfolio performance.",
        "order2026": 13,
        "featured2026": False,
    },
    {
        "name": "Ryan Christiansen",
        "title": "Senior Director",
        "company": "University of Utah Fintech Center",
        "photo": "images/2026-ryan-christiansen.jpg",
        "linkedin": "https://www.linkedin.com/in/ryan-christiansen-utah/",
        "bio": "Ryan Christiansen is the Senior Director of the University of Utah Fintech Center, overseeing research labs, a venture fund, a startup incubator, and experiential student programs that accelerate fintech innovation and workforce development. Before academia, Ryan served as Senior Vice President of Data Access Partnerships at Mastercard following the company's $985 million acquisition of Finicity. As a member of Finicity's senior leadership team, he helped transform the startup into a market leading data access platform and continued to guide global open banking strategy at Mastercard\u2014negotiating landmark agreements with major financial institutions and advancing tokenized, consumer permissioned data exchange. Ryan is a founding architect of the Financial Data Exchange (FDX), where he co chairs the Certification Working Group and helps define the international standards that underpin open banking services adopted by more than 100 million consumers. He also co chairs the Utah Governor's Fintech Council, advising state leaders on policy that fosters responsible innovation. Prior to joining Finicity, Ryan spent 20+ years as senior executive at national banks, giving him a unique perspective that bridges traditional finance, fintech disruption, and public policy.",
        "order2026": 14,
        "featured2026": False,
    },
    {
        "name": "Sarvesh Baveja",
        "title": "Chief Risk and Data Officer",
        "company": "Fundbox",
        "photo": "images/2026-sarvesh-baveja.jpg",
        "linkedin": "https://www.linkedin.com/in/sbaveja/",
        "bio": "Sarvesh Baveja is the Chief Risk and Data Officer at Fundbox, overseeing underwriting models, credit policy, and collections operations. With over 14 years of experience, including leadership roles at Capital One, Sarvesh brings deep expertise in AI/ML-driven decisioning, credit and model risk management, and SMB-specific underwriting.",
        "order2026": 15,
        "featured2026": False,
    },
]


def slugify(name: str) -> str:
    slug = name.lower()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug.strip())
    return slug


def main() -> None:
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        speakers = json.load(f)

    by_name = {s["name"].strip().lower(): s for s in speakers}
    max_order = max((s.get("order", 0) for s in speakers), default=0)

    updated, added = 0, 0
    for entry in SPEAKERS_2026:
        key = entry["name"].strip().lower()
        existing = by_name.get(key)

        if existing:
            existing["title"] = entry["title"]
            existing["company"] = entry["company"]
            existing["photo"] = entry["photo"]
            existing["linkedin"] = entry["linkedin"]
            existing["bio"] = entry["bio"]
            existing["order2026"] = entry["order2026"]
            existing["featured2026"] = entry["featured2026"]
            years = [y.strip() for y in existing.get("year", "").split(",") if y.strip()]
            if "2026" not in years:
                years.append("2026")
            existing["year"] = ", ".join(years)
            updated += 1
        else:
            max_order += 1
            speakers.append({
                "id": slugify(entry["name"]),
                "name": entry["name"],
                "title": entry["title"],
                "company": entry["company"],
                "photo": entry["photo"],
                "linkedin": entry["linkedin"],
                "bio": entry["bio"],
                "year": "2026",
                "featured": False,
                "order": max_order,
                "order2026": entry["order2026"],
                "featured2026": entry["featured2026"],
            })
            added += 1

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(speakers, f, indent=2)
        f.write("\n")

    print(f"Updated {updated} existing speakers, added {added} new speakers.")
    print(f"Total speakers in file: {len(speakers)}")


if __name__ == "__main__":
    main()
