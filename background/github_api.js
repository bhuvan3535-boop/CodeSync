export async function pushToGitHub(token, repo, path, content, message) {
    const url = `https://api.github.com/repos/${repo}/contents/${path}`;
    
    // Safely encode content to Base64 (handles Unicode, emojis, and SQL tables)
    const base64Content = btoa(unescape(encodeURIComponent(content)));
    
    // Fetch file SHA if it already exists (required by GitHub for updates)
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

    const body = {
        message: message,
        content: base64Content
    };
    
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