import { pushToGitHub } from './github_api.js';

const extensionMap = {
  "python": "py", "python3": "py", "c++": "cpp", "cpp": "cpp", "java": "java",
  "javascript": "js", "mysql": "sql", "mssql": "sql", "oraclesql": "sql", "postgresql": "sql", "pandas": "py"
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "PUSH_SUBMISSION") {
    checkPerformanceAndUpload(request.data);
  } 
  else if (request.action === "START_MASS_SYNC") {
    startMassSync(request.csrf);
  }
  return true; 
});

async function getCredentials() {
  const data = await chrome.storage.local.get(['githubToken', 'githubRepo']);
  if (!data.githubToken || !data.githubRepo) {
    throw new Error("GitHub credentials missing! Please set them in the extension popup.");
  }
  return data;
}

async function checkPerformanceAndUpload(data) {
  const { platform, problemName, code, language, readme, runtime } = data;
  const fileExt = extensionMap[language] || "txt";
  const currentRuntimeMs = parseInt(runtime) || 99999;
  const storageKey = `stats_${problemName}`;
  
  try {
    const credentials = await getCredentials();
    const stored = await chrome.storage.local.get(storageKey);
    const pastRecord = stored[storageKey];

    if (!pastRecord || currentRuntimeMs <= pastRecord.bestRuntime) {
      console.log(`Uploading! New best time: ${currentRuntimeMs}ms`);
      const folderLang = language.charAt(0).toUpperCase() + language.slice(1);
      
      const codeFilePath = `${platform}/${folderLang}/${problemName}/solution.${fileExt}`;
      const readmeFilePath = `${platform}/${folderLang}/${problemName}/README.md`;
      const commitMsg = `Add ${language} solution for ${problemName} - Runtime: ${runtime}`;

      await pushToGitHub(credentials.githubToken, credentials.githubRepo, codeFilePath, code, commitMsg);
      await pushToGitHub(credentials.githubToken, credentials.githubRepo, readmeFilePath, readme, commitMsg);
      
      await chrome.storage.local.set({ [storageKey]: { bestRuntime: currentRuntimeMs } });
    } else {
      console.log(`Skipped upload. Old time (${pastRecord.bestRuntime}ms) was faster.`);
    }
  } catch (err) {
    console.error("Upload failed: ", err.message);
  }
}

async function startMassSync(csrfToken) {
  console.log("Starting Mass Sync...");
  
  try {
    await getCredentials(); 

    const response = await fetch("https://leetcode.com/api/problems/all/");
    const data = await response.json();
    
    const solvedProblems = data.stat_status_pairs
      .filter(pair => pair.status === "ac")
      .map(pair => pair.stat.question__title_slug);
      
    console.log(`Found ${solvedProblems.length} solved problems! Syncing...`);

    for (let i = 0; i < solvedProblems.length; i++) {
      const problemName = solvedProblems[i];
      console.log(`Syncing ${i+1}/${solvedProblems.length}: ${problemName}`);
      
      await syncSingleHistoricalProblem(problemName, csrfToken);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log("Mass Sync Complete!");
  } catch (err) {
    console.error("Mass sync failed:", err.message);
  }
}

async function syncSingleHistoricalProblem(problemName, csrf) {
  try {
    const questionResponse = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrftoken": csrf },
        body: JSON.stringify({
            query: `query questionData($titleSlug: String!) {
                question(titleSlug: $titleSlug) { content }
            }`,
            variables: { titleSlug: problemName }
        })
    });
    const questionData = await questionResponse.json();
    const descriptionHTML = questionData?.data?.question?.content || "Description not available.";
    const fullReadme = `# ${problemName}\n\n## Problem Description\n\n${descriptionHTML}`;

    const listResponse = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrftoken": csrf },
        body: JSON.stringify({
            query: `query submissionList($offset: Int!, $limit: Int!, $questionSlug: String!) {
                questionSubmissionList(offset: $offset, limit: $limit, questionSlug: $questionSlug) {
                    submissions { id statusDisplay }
                }
            }`,
            variables: { offset: 0, limit: 20, questionSlug: problemName }
        })
    });
    const listData = await listResponse.json();
    const submissions = listData?.data?.questionSubmissionList?.submissions;
    if (!submissions || submissions.length === 0) return;
    
    const acceptedSub = submissions.find(sub => sub.statusDisplay === "Accepted");
    if (!acceptedSub) return;

    const detailResponse = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrftoken": csrf },
        body: JSON.stringify({
            query: `query submissionDetails($submissionId: Int!) {
                submissionDetails(submissionId: $submissionId) { code lang { name } runtime }
            }`,
            variables: { submissionId: parseInt(acceptedSub.id) }
        })
    });
    const detailData = await detailResponse.json();
    const dataObj = detailData?.data?.submissionDetails;

    if (!dataObj) return;

    await checkPerformanceAndUpload({
      platform: "LeetCode",
      problemName: problemName,
      code: dataObj.code,
      language: dataObj.lang.name,
      readme: fullReadme,
      runtime: dataObj.runtime
    });

  } catch (err) {
    console.error(`Failed historical sync for ${problemName}:`, err);
  }
}