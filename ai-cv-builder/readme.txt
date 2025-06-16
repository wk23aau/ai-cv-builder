=== AI CV Builder ===
Contributors: Your Name or Company
Tags: cv, resume, ai, gemini, builder, editor, shortcode, react
Requires at least: 5.0
Tested up to: 6.5
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Build and style CVs with AI-powered content generation using Google's Gemini API, integrated into WordPress.

== Description ==

AI CV Builder allows users to create professional-looking CVs/resumes directly within their WordPress site.
The plugin provides a secure way to use the Gemini API by handling API key management and API calls on the server-side.
The interactive CV builder frontend is a React application (source typically in `ai-cv-builder/src/` within the plugin).

Features include:
*   AI-powered content generation for summaries, experience, skills, etc., using the Gemini API.
*   Theme selection and customization.
*   Manual content editing.
*   PDF download of the generated CV.
*   Tailor CV content to specific job descriptions.

Site administrators can securely configure the Gemini API key via the WordPress dashboard (Settings > AI CV Builder).
The CV builder can be embedded on any page or post using the `[ai_cv_builder]` shortcode.

== Installation ==

1.  **Download and Prepare Plugin:**
    *   If you have a ZIP file named `ai-cv-builder.zip`, ensure it contains the `ai-cv-builder` folder at its root, and inside that folder is `ai-cv-builder.php` along with `admin/`, `public/`, `includes/`, `src/`, and `assets/` directories.
    *   If you have the `ai-cv-builder` folder directly, this is what you'll work with.
2.  **Build React App (CRUCIAL):**
    *   The plugin's frontend is a React application. Its source code is located within the plugin structure, typically at `ai-cv-builder/src/`.
    *   You **MUST** build this React application before the plugin will work correctly.
    *   Open your terminal/command prompt.
    *   Navigate **into** the React app's source directory (e.g., `cd path/to/wordpress/wp-content/plugins/ai-cv-builder/src/`).
    *   Run the package installation command: `npm install` (or `yarn install`).
    *   Run the build command: `npm run build` (or `yarn build`). This command might vary based on how the `package.json` in `ai-cv-builder/src/` is configured.
    *   This build process will generate static JavaScript and CSS files. These files are typically output to a `build` or `dist` folder *within* the `ai-cv-builder/src/` directory (e.g., `ai-cv-builder/src/build/static/js/main.XXXXXXXX.js`).
3.  **Copy Compiled Assets:**
    *   Copy the main JavaScript file (e.g., `main.XXXXXXXX.js`) from the React build output (e.g., `ai-cv-builder/src/build/static/js/`) to `ai-cv-builder/assets/js/main.js`.
    *   Copy the main CSS file (e.g., `main.XXXXXXXX.css`) from the React build output (e.g., `ai-cv-builder/src/build/static/css/`) to `ai-cv-builder/assets/css/main.css`.
    *   **Note:** You must rename the files to `main.js` and `main.css` respectively if they have hashes in their names, or update the paths in `ai-cv-builder/public/class-ai-cv-builder-public.php` to match the actual generated filenames from your React build.
4.  **Upload and Activate Plugin:**
    *   Create a ZIP file of the entire `ai-cv-builder` folder (which now includes the `assets` folder with your compiled `main.js` and `main.css`).
    *   In your WordPress admin, go to Plugins > Add New > Upload Plugin.
    *   Upload the `ai-cv-builder.zip` file.
    *   Activate the plugin through the 'Plugins' menu in WordPress.
5.  **Configure API Key:** Go to **Settings > AI CV Builder** in your WordPress admin dashboard and enter your Google Gemini API Key. Save the settings.
6.  **Use Shortcode:** Place the shortcode `[ai_cv_builder]` on any page or post where you want the CV builder to appear.

== Frequently Asked Questions ==

= How do I get a Gemini API Key? =
You can obtain a Gemini API key from Google AI Studio: https://aistudio.google.com/app/apikey

= Where do I put the compiled React app files? =
After building your React app (from `ai-cv-builder/src/`), place the main JavaScript file into `wp-content/plugins/ai-cv-builder/assets/js/main.js` and the main CSS file into `wp-content/plugins/ai-cv-builder/assets/css/main.css`. Ensure the filenames match what's expected by `public/class-ai-cv-builder-public.php`.

= The CV Builder shows "Loading CV Builder..." indefinitely or looks unstyled. =
This usually means the React application's JavaScript or CSS files were not loaded correctly. Check your browser's developer console (usually F12) for errors. Ensure:
    1. You have successfully built the React app located in `ai-cv-builder/src/`.
    2. The compiled `main.js` and `main.css` files are in the correct `ai-cv-builder/assets/js/` and `ai-cv-builder/assets/css/` directories.
    3. The filenames exactly match `main.js` and `main.css`, or the paths in `public/class-ai-cv-builder-public.php` have been updated if your build produces different names.

= I get an error about "API key not configured" or "AJAX request failed". =
    1. Double-check that you have entered and saved your Gemini API Key in Settings > AI CV Builder.
    2. Ensure there are no conflicts with other plugins that might interfere with AJAX requests.
    3. Check your browser's developer console and your server's PHP error logs (often found in `wp-content/debug.log` if WP_DEBUG is enabled, or your hosting provider's error logs) for more details.

== Screenshots ==
(Coming soon)

== Changelog ==

= 1.0.0 =
* Initial release. WordPress plugin structure, API key management, AJAX handling for Gemini API, and React app shortcode embedding.

== Upgrade Notice ==

= 1.0.0 =
* Initial release.
