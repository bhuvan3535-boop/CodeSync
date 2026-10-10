// 1. When the popup opens, load any saved credentials and fill the boxes
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['githubToken', 'githubRepo'], (result) => {
    if (result.githubToken) document.getElementById('githubToken').value = result.githubToken;
    if (result.githubRepo) document.getElementById('githubRepo').value = result.githubRepo;
  });
});

// 2. When the Save button is clicked, save the credentials securely
document.getElementById('saveBtn').addEventListener('click', () => {
  const token = document.getElementById('githubToken').value.trim();
  const repo = document.getElementById('githubRepo').value.trim();
  const statusDiv = document.getElementById('saveStatus');

  if (!token || !repo) {
    statusDiv.innerText = "Please fill in both fields!";
    statusDiv.style.color = "#cb2431"; // Red
    return;
  }

  chrome.storage.local.set({ 'githubToken': token, 'githubRepo': repo }, () => {
    statusDiv.innerText = "Settings saved successfully!";
    statusDiv.style.color = "#28a745"; // Green
    setTimeout(() => { statusDiv.innerText = ""; }, 3000); // Clear message after 3 seconds
  });
});

// 3. When the Sync button is clicked, start the mass sync (if credentials exist)
document.getElementById('syncBtn').addEventListener('click', () => {
  const statusDiv = document.getElementById('syncStatus');
  
  // First, check if they actually saved their settings
  chrome.storage.local.get(['githubToken', 'githubRepo'], (result) => {
    if (!result.githubToken || !result.githubRepo) {
      statusDiv.innerText = "Error: Please save your GitHub settings first!";
      statusDiv.style.color = "#cb2431";
      return;
    }

    statusDiv.innerText = "Sync started! Keep this window open. Check extension errors for progress.";
    statusDiv.style.color = "#0366d6"; // Blue
    
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      let activeTab = tabs[0];
      
      if (!activeTab || !activeTab.url || !activeTab.url.includes("leetcode.com")) {
         statusDiv.innerText = "Error: You must be on a LeetCode page to sync!";
         statusDiv.style.color = "#cb2431";
         return;
      }
      
      chrome.scripting.executeScript({
        target: {tabId: activeTab.id},
        func: () => {
          const match = document.cookie.match(/csrftoken=([^;]+)/);
          return match ? match[1] : "";
        }
      }, (results) => {
        if (results && results[0] && results[0].result) {
          chrome.runtime.sendMessage({
            action: "START_MASS_SYNC",
            csrf: results[0].result
          });
        } else {
          statusDiv.innerText = "Error: Please log into LeetCode first!";
          statusDiv.style.color = "#cb2431";
        }
      });
    });
  });
});