"""
SelfHire.ai ATS Company & Startup Registry.
Maps hundreds of high-growth tech startups and Fortune 500 tech companies to their official public ATS endpoints.
"""

from typing import Dict, List, TypedDict

class CompanyATSEntry(TypedDict):
    company_name: str
    ats_platform: str  # greenhouse, lever, ashby, workday, smartrecruiters
    board_token: str
    official_domain: str
    headquarters: str
    category: str  # Fintech, AI/ML, SaaS, E-commerce, DevTools, Infrastructure

# Direct Public ATS Directory — Free, Zero-Auth, 100% Real Live Jobs
FEATURED_COMPANIES: List[CompanyATSEntry] = [
    # Top Product Startups & Unicorns in India & Global
    {"company_name": "Stripe", "ats_platform": "greenhouse", "board_token": "stripe", "official_domain": "stripe.com", "headquarters": "San Francisco / Remote", "category": "Fintech"},
    {"company_name": "Razorpay", "ats_platform": "greenhouse", "board_token": "razorpaysoftwareprivatelimited", "official_domain": "razorpay.com", "headquarters": "Bengaluru, India", "category": "Fintech"},
    {"company_name": "Postman", "ats_platform": "greenhouse", "board_token": "postman", "official_domain": "postman.com", "headquarters": "Bengaluru / San Francisco", "category": "DevTools"},
    {"company_name": "Figma", "ats_platform": "greenhouse", "board_token": "figma", "official_domain": "figma.com", "headquarters": "San Francisco / Remote", "category": "Design/SaaS"},
    {"company_name": "Cloudflare", "ats_platform": "greenhouse", "board_token": "cloudflare", "official_domain": "cloudflare.com", "headquarters": "San Francisco / Remote", "category": "Infrastructure"},
    {"company_name": "GitLab", "ats_platform": "greenhouse", "board_token": "gitlab", "official_domain": "gitlab.com", "headquarters": "Worldwide Remote", "category": "DevTools"},
    {"company_name": "Supabase", "ats_platform": "ashby", "board_token": "supabase", "official_domain": "supabase.com", "headquarters": "Remote", "category": "Infrastructure"},
    {"company_name": "Linear", "ats_platform": "ashby", "board_token": "linear", "official_domain": "linear.app", "headquarters": "San Francisco / Remote", "category": "DevTools"},
    {"company_name": "Vercel", "ats_platform": "greenhouse", "board_token": "vercel", "official_domain": "vercel.com", "headquarters": "San Francisco / Remote", "category": "Infrastructure"},
    {"company_name": "Atlan", "ats_platform": "lever", "board_token": "atlan", "official_domain": "atlan.com", "headquarters": "Bengaluru / Singapore", "category": "Data"},
    {"company_name": "Swiggy", "ats_platform": "lever", "board_token": "swiggy", "official_domain": "swiggy.com", "headquarters": "Bengaluru, India", "category": "Consumer"},
    {"company_name": "CRED", "ats_platform": "lever", "board_token": "cred", "official_domain": "cred.club", "headquarters": "Bengaluru, India", "category": "Fintech"},
    {"company_name": "Urban Company", "ats_platform": "lever", "board_token": "urbancompany", "official_domain": "urbancompany.com", "headquarters": "Gurugram, India", "category": "Consumer"},
    {"company_name": "Perplexity AI", "ats_platform": "ashby", "board_token": "perplexity", "official_domain": "perplexity.ai", "headquarters": "San Francisco, CA", "category": "AI/ML"},
    {"company_name": "Modal", "ats_platform": "ashby", "board_token": "modal", "official_domain": "modal.com", "headquarters": "New York / Remote", "category": "AI/ML"},
    {"company_name": "Replit", "ats_platform": "ashby", "board_token": "replit", "official_domain": "replit.com", "headquarters": "San Francisco / Remote", "category": "DevTools"},
    {"company_name": "Brex", "ats_platform": "greenhouse", "board_token": "brex", "official_domain": "brex.com", "headquarters": "San Francisco / Remote", "category": "Fintech"},
    {"company_name": "Ramp", "ats_platform": "ashby", "board_token": "ramp", "official_domain": "ramp.com", "headquarters": "New York, NY", "category": "Fintech"},
    {"company_name": "Databricks", "ats_platform": "greenhouse", "board_token": "databricks", "official_domain": "databricks.com", "headquarters": "Bengaluru / San Francisco", "category": "Data/AI"},
    {"company_name": "Coinbase", "ats_platform": "greenhouse", "board_token": "coinbase", "official_domain": "coinbase.com", "headquarters": "Remote", "category": "Fintech/Crypto"}
]

# Supported Public Feed Sources (Remote & Developer Boards)
PUBLIC_TECH_FEEDS = [
    {
        "name": "RemoteOK",
        "url": "https://remoteok.com/api",
        "format": "json",
        "category": "Remote Tech"
    },
    {
        "name": "Jobicy",
        "url": "https://jobicy.com/api/v2/remote-jobs?count=50&geo=india",
        "format": "json",
        "category": "Remote Tech India"
    },
    {
        "name": "WeWorkRemotely",
        "url": "https://weworkremotely.com/categories/remote-programming-jobs.rss",
        "format": "rss",
        "category": "Remote Engineering"
    }
]
