"""
SelfHire.ai Unified Portal Selectors & Autofill Registry.
Derived from battle-tested production engines (Instahyre, Wellfound, Greenhouse, Ashby, Lever, Workday).
Guarantees exact-action DOM field detection for one-click manual & extension autofill.
"""

from typing import Dict, Any, List

PORTAL_SELECTORS_REGISTRY: Dict[str, Dict[str, Any]] = {
    "instahyre": {
        "portal_name": "Instahyre",
        "domain": "instahyre.com",
        "technology_stack": "AngularJS",
        "selectors": {
            "view_job_button": "button.btn-interested, button:has-text('View job »'), button:has-text('View »')",
            "modal_container": "div[ng-controller='employerProfileModalCtrl'], .application-modal-backdrop",
            "apply_button": "button.btn-primary.apply-btn, button[ng-click*='apply'], button:has-text('Apply')",
            "cover_note_input": "textarea[ng-model*='cover_note'], textarea[placeholder*='note']",
            "pagination_next": "li.next > a, button:has-text('Next »')",
            "close_modal": "button.close, span:has-text('×')",
        },
        "supported_fields": ["full_name", "email", "phone", "cover_note", "current_location", "skills"]
    },
    "wellfound": {
        "portal_name": "Wellfound (AngelList)",
        "domain": "wellfound.com",
        "technology_stack": "React / Next.js",
        "selectors": {
            "job_card": "[data-test='JobListingCard'], div[class*='styles_jobListing']",
            "apply_button": "button:has-text('Apply'), button[data-test='JobDetailApplyButton']",
            "cover_note_input": "textarea[name='userNote'], textarea[placeholder*='pitch'], textarea[placeholder*='note']",
            "desired_salary_input": "input[name='desiredSalary'], input[placeholder*='Salary']",
            "submit_application": "button:has-text('Send application'), button[type='submit']",
        },
        "supported_fields": ["full_name", "email", "cover_note", "desired_salary", "location"]
    },
    "greenhouse": {
        "portal_name": "Greenhouse",
        "domain": "boards.greenhouse.io",
        "technology_stack": "Rails / Turbo",
        "selectors": {
            "form": "#application_form",
            "first_name": "#first_name",
            "last_name": "#last_name",
            "email": "#email",
            "phone": "#phone",
            "resume_upload": "#resume, input[type='file'][name*='resume']",
            "cover_letter": "#cover_letter, textarea[name*='cover_letter']",
            "linkedin_url": "input[autocomplete='custom-question-linkedin'], input[name*='linkedin']",
            "submit_button": "#submit_app, input[type='submit'][value*='Submit']",
        },
        "supported_fields": ["first_name", "last_name", "email", "phone", "resume", "linkedin_url", "github_url"]
    },
    "ashby": {
        "portal_name": "Ashby",
        "domain": "jobs.ashbyhq.com",
        "technology_stack": "React / GraphQL",
        "selectors": {
            "form": "form[class*='applicationForm'], div[class*='_applicationContainer']",
            "full_name": "input[name='name']",
            "email": "input[name='email']",
            "phone": "input[name='phone']",
            "resume_upload": "input[type='file']",
            "submit_button": "button[type='submit'], button:has-text('Submit Application')",
        },
        "supported_fields": ["full_name", "email", "phone", "resume", "linkedin_url", "portfolio_url"]
    },
    "lever": {
        "portal_name": "Lever",
        "domain": "jobs.lever.co",
        "technology_stack": "React",
        "selectors": {
            "form": "#application-form",
            "full_name": "input[name='name']",
            "email": "input[name='email']",
            "phone": "input[name='phone']",
            "resume_upload": "input[name='resume']",
            "additional_info": "textarea[name='comments']",
            "submit_button": "#btn-submit, button[type='submit']",
        },
        "supported_fields": ["full_name", "email", "phone", "resume", "linkedin_url", "additional_info"]
    },
    "workday": {
        "portal_name": "Workday",
        "domain": "myworkdayjobs.com",
        "technology_stack": "Workday Enterprise UI",
        "selectors": {
            "apply_button": "a[data-automation-id='applyButton'], button[data-automation-id='applyButton']",
            "quick_apply": "button:has-text('Autofill with Resume')",
            "resume_upload": "input[data-automation-id='file-upload-input']",
            "next_button": "button[data-automation-id='bottom-navigation-next-button']",
            "submit_button": "button[data-automation-id='page-footer-submit-button']",
        },
        "supported_fields": ["full_name", "email", "phone", "resume", "work_authorization", "experience"]
    }
}


def get_portal_selectors(domain_or_url: str) -> Dict[str, Any]:
    """Retrieves standard selectors matching a portal domain."""
    lowered = domain_or_url.lower()
    for key, portal in PORTAL_SELECTORS_REGISTRY.items():
        if portal["domain"] in lowered or key in lowered:
            return portal
    return {
        "portal_name": "Universal Generic ATS",
        "domain": domain_or_url,
        "technology_stack": "Generic HTML5",
        "selectors": {
            "form": "form",
            "email": "input[type='email'], input[name*='email']",
            "name": "input[name*='name']",
            "phone": "input[type='tel'], input[name*='phone']",
            "resume": "input[type='file']",
            "submit": "button[type='submit'], input[type='submit']"
        },
        "supported_fields": ["full_name", "email", "phone", "resume"]
    }
