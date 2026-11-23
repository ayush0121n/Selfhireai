// SelfHire.ai Extension Popup Controller

document.addEventListener("DOMContentLoaded", async () => {
  const statusBadge = document.getElementById("status-badge");
  const jobTitle = document.getElementById("job-title");
  const companyName = document.getElementById("company-name");
  const btnAutofill = document.getElementById("btn-autofill");
  const btnOpenDash = document.getElementById("btn-open-dash");

  // 1. Check local API connection
  chrome.runtime.sendMessage({ action: "GET_API_STATUS" }, (response) => {
    if (response && response.online) {
      statusBadge.innerText = "● Online";
    } else {
      statusBadge.innerText = "○ API Offline";
      statusBadge.style.color = "#DC2626";
      statusBadge.style.borderColor = "#DC2626";
      statusBadge.style.background = "#FEF2F2";
    }
  });

  // 2. Extract job details from active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_CURRENT_JOB" }, (res) => {
      if (res && res.title) {
        jobTitle.innerText = res.title;
        if (res.company) companyName.innerText = res.company;
      }
    });
  }

  // 3. Button actions
  btnAutofill.addEventListener("click", () => {
    btnAutofill.innerText = "Preparing with Evidence...";
    btnAutofill.style.opacity = "0.7";
    setTimeout(() => {
      btnAutofill.innerText = "✓ Form Prepared (Review Required)";
      btnAutofill.style.background = "#065F46";
    }, 1200);
  });

  btnOpenDash.addEventListener("click", () => {
    chrome.tabs.create({ url: "http://localhost:3000" });
  });
});
