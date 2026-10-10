document.addEventListener('click', (e) => {
  const submitBtn = e.target.closest('[data-e2e-locator="console-submit-button"]');
  if (submitBtn) {
    waitForResult();
  }
});

function waitForResult() {
  const interval = setInterval(() => {
    const successTag = document.querySelector('[data-e2e-locator="submission-result"]');
    if (successTag && successTag.innerText.includes('Accepted')) {
      clearInterval(interval); 
      fetchCodeAndSend(); 
    } else if (document.querySelector('.error-message-container')) {
      clearInterval(interval); 
    }
  }, 1000);
}

function getCSRFToken() {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : "";
}

async function fetchCodeAndSend() {
  const urlParts = window.location.pathname.split('/');
  const problemName = urlParts[2]; 

  const descContainer = document.querySelector('[data-track-load="description_content"]');
  const fallbackDesc = document.querySelector('meta[name="description"]');
  let descriptionText = descContainer ? descContainer.innerHTML : (fallbackDesc ? fallbackDesc.content : "Description not found.");
  const readmeContent = `# ${problemName}\n\n## Problem Description\n\n${descriptionText}`;

  try {
    const csrf = getCSRFToken();
    
    const listResponse = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrftoken": csrf },
        body: JSON.stringify({
            query: `query submissionList($offset: Int!, $limit: Int!, $questionSlug: String!) {
                questionSubmissionList(offset: $offset, limit: $limit, questionSlug: $questionSlug) {
                    submissions { id statusDisplay }
                }
            }`,
            variables: { offset: 0, limit: 1, questionSlug: problemName }
        })
    });
    
    const listData = await listResponse.json();
    const submissions = listData.data.questionSubmissionList.submissions;
    if (submissions.length === 0 || submissions[0].statusDisplay !== "Accepted") return;
    
    const submissionId = parseInt(submissions[0].id);

    // NEW: We added "runtime" to the API request
    const detailResponse = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrftoken": csrf },
        body: JSON.stringify({
            query: `query submissionDetails($submissionId: Int!) {
                submissionDetails(submissionId: $submissionId) { code lang { name } runtime }
            }`,
            variables: { submissionId: submissionId }
        })
    });
    const detailData = await detailResponse.json();
    const finalCode = detailData.data.submissionDetails.code;
    const finalLanguage = detailData.data.submissionDetails.lang.name;
    const runtimeStr = detailData.data.submissionDetails.runtime; // e.g., "55 ms"

    chrome.runtime.sendMessage({
      action: "PUSH_SUBMISSION",
      data: {
        platform: "LeetCode",
        problemName: problemName,
        code: finalCode,
        language: finalLanguage,
        readme: readmeContent,
        runtime: runtimeStr 
      }
    });
  } catch (error) {
    if (error.message.includes("Extension context invalidated")) {
      alert("Extension updated! Please refresh this LeetCode page to reconnect.");
    } else {
      console.error("Failed to fetch:", error);
    }
  }
}