document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['githubToken', 'githubRepo'], (result) => {
    if (result.githubToken) document.getElementById('githubToken').value = result.githubToken;
    if (result.githubRepo) document.getElementById('githubRepo').value = result.githubRepo;
  });
});

document.getElementById('saveBtn').addEventListener('click', () => {
  const token = document.getElementById('githubToken').value.trim();
  const repo = document.getElementById('githubRepo').value.trim();
  const statusDiv = document.getElementById('saveStatus');

  if (!token || !repo) {
    statusDiv.innerText = "Please fill in both fields!";
    statusDiv.style.color = "#cb2431";
    return;
  }

  chrome.storage.local.set({ 'githubToken': token, 'githubRepo': repo }, () => {
    statusDiv.innerText = "Settings saved successfully!";
    statusDiv.style.color = "#28a745";
    setTimeout(() => { statusDiv.innerText = ""; }, 3000);
  });
});

document.getElementById('syncBtn').addEventListener('click', () => {
  const statusDiv = document.getElementById('syncStatus');
  
  chrome.storage.local.get(['githubToken', 'githubRepo'], (result) => {
    if (!result.githubToken || !result.githubRepo) {
      statusDiv.innerText = "Error: Please save your GitHub settings first!";
      statusDiv.style.color = "#cb2431";
      return;
    }

    statusDiv.innerText = "Sync started! Keep this window open.";
    statusDiv.style.color = "#0366d6";
    
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