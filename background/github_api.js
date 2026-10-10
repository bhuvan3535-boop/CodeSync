export async function pushToGitHub(token, repo, path, content, message) {
    const url = `https://api.github.com/repos/${repo}/contents/${path}`;
    
    // 1. Safely encode content to Base64 (Handles SQL tables, Unicode, and emojis without crashing)
    const base64Content = btoa(unescape(encodeURIComponent(content)));
    
    // 2. Fetch the file's current SHA if it already exists (GitHub strictly requires this for updates)
    let sha = null;
    const getResponse = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github.v3+json"
        }
    });

    if (getResponse.ok) {
        const fileData = await getResponse.json();
        sha = fileData.sha;
    }

    // 3. Upload the new code/README
    const body = {
        message: message,
        content: base64Content
    };
    
    // Inject the SHA into our request if we are overwriting an older, slower submission
    if (sha) {
        body.sha = sha; 
    }

    const putResponse = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!putResponse.ok) {
        const errorData = await putResponse.json();
        throw new Error(errorData.message);
    }
}