# 🚀 LeetCode to GitHub Auto-Sync

A scalable, automated Chrome Extension that seamlessly pushes your accepted LeetCode solutions directly to your GitHub repository. Stop manually copying and pasting your code—let this extension build your DSA portfolio automatically!

## ✨ Features

*   **⚡️ Smart Performance Tracking:** It tracks your execution time. If you submit an optimized solution that runs faster than your previous one, it automatically overwrites the old file on GitHub and updates the commit message with your new runtime.
*   **📂 Language Categorization:** Solutions are automatically organized into language-specific folders (e.g., `LeetCode/Python/TwoSum/solution.py`). Supports Python, JavaScript, C++, Java, and all SQL variants.
*   **📝 Rich README Generation:** Automatically pulls the full problem description directly from LeetCode's database and formats it into a beautiful markdown file alongside your code (perfectly preserving HTML and SQL tables).
*   **🔄 Historical Mass Sync:** Already have hundreds of solved problems? Use the built-in popup to trigger a background sync that securely fetches and uploads your entire LeetCode history, complete with a safe delay to prevent API blocking.
*   **🔒 Secure UI Control Panel:** No hardcoded secrets. A clean popup interface allows you to save your GitHub Personal Access Token and Repository name directly into Chrome's secure local storage.

## 🛠️ Tech Stack

*   **Architecture:** Manifest V3
*   **Language:** Vanilla JavaScript (ES6+), HTML, CSS
*   **APIs Used:** GitHub REST API, LeetCode GraphQL API, Chrome Extension APIs (`storage`, `scripting`, `activeTab`)

## 📦 Installation (Developer Mode)

1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click the **Load unpacked** button in the top left.
5. Select the main folder containing the extension files.

## ⚙️ Configuration

1. **Create a GitHub Token:** 
   * Go to your GitHub Settings > Developer settings > Personal access tokens (Tokens (classic)).
   * Generate a new token with the **`repo`** scope checked.
2. **Setup Repository:** Create a new empty repository on GitHub where you want your code to be saved.
3. **Connect the Extension:**
   * Pin the extension to your Chrome toolbar.
   * Click the icon to open the settings popup.
   * Enter your GitHub Token and your Repository name (format: `your-username/your-repo-name`).
   * Click **Save Settings**.

## 🚀 Usage

### Automatic Sync
Simply go to [LeetCode](https://leetcode.com), write your code, and hit **Submit**. The moment you receive an "Accepted" status, the extension will silently fetch the exact code, language, runtime, and problem description, and push it to your GitHub. 

### Syncing Past Problems
To backfill your GitHub with problems you solved before installing this extension:
1. Ensure you are logged into LeetCode and are currently on a LeetCode web page.
2. Click the extension icon in your Chrome toolbar.
3. Click **Sync All Past Problems**.
4. Leave the browser tab open while the extension works in the background (you can check the service worker console for live progress logs).

## 🤝 Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.