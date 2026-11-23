// SelfHire.ai Content Script — Extracts job data with Shadow DOM isolation

(function () {
  function extractJobMetadata() {
    let jobData = {
      title: "",
      company: "",
      url: window.location.href,
      jdText: "",
      hasForm: false
    };

    // 1. Check for schema.org/JobPosting JSON-LD
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const parsed = JSON.parse(script.innerText);
        const item = Array.isArray(parsed) ? parsed.find(x => x["@type"] === "JobPosting") : parsed;
        if (item && item["@type"] === "JobPosting") {
          jobData.title = item.title || "";
          jobData.company = item.hiringOrganization?.name || "";
          jobData.jdText = item.description || "";
          break;
        }
      } catch (e) {}
    }

    // 2. Fallback to DOM elements
    if (!jobData.title) {
      const h1 = document.querySelector("h1");
      jobData.title = h1 ? h1.innerText.trim() : document.title;
    }

    if (!jobData.jdText) {
      const main = document.querySelector("main") || document.querySelector("article") || document.body;
      jobData.jdText = main ? main.innerText.slice(0, 3000) : "";
    }

    // Check if an application form is present on the page
    const form = document.querySelector("form");
    const inputs = document.querySelectorAll("input:not([type='hidden'])");
    jobData.hasForm = form !== null && inputs.length >= 3;

    return jobData;
  }

  // Listen for extraction requests from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "EXTRACT_CURRENT_JOB") {
      const data = extractJobMetadata();
      sendResponse(data);
    }
  });
})();
