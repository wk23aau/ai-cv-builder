<?php
/**
 * Plugin Name:       AI CV Builder
 * Plugin URI:        https://example.com/plugins/ai-cv-builder/
 * Description:       Build beautiful CVs with AI assistance, using a shortcode to embed the builder interface.
 * Version:           1.0.0
 * Author:            Jules for Google
 * Author URI:        https://google.com/
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       ai-cv-builder
 * Domain Path:       /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

/**
 * Add the admin menu item.
 */
function aicvb_add_admin_menu() {
    add_options_page(
        'AI CV Builder Settings',
        'AI CV Builder',
        'manage_options',
        'ai_cv_builder_settings',
        'aicvb_settings_page_html'
    );
}
add_action( 'admin_menu', 'aicvb_add_admin_menu' );

/**
 * Render the settings page HTML.
 */
function aicvb_settings_page_html() {
    if ( ! current_user_can( 'manage_options' ) ) {
        return;
    }
    ?>
    <div class="wrap">
        <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
        <form action="options.php" method="post">
            <?php
            settings_fields( 'aicvb_settings_group' );
            do_settings_sections( 'ai_cv_builder_settings' );
            submit_button( 'Save API Key' );
            ?>
        </form>
    </div>
    <?php
}

/**
 * Initialize settings.
 */
function aicvb_settings_init() {
    register_setting( 'aicvb_settings_group', 'aicvb_gemini_api_key', 'sanitize_text_field' );

    add_settings_section(
        'aicvb_api_settings_section',
        'API Key Configuration',
        null,
        'ai_cv_builder_settings'
    );

    add_settings_field(
        'aicvb_gemini_api_key_field', // Keep ID for compatibility if settings are saved
        'API Key', // Changed Label
        'aicvb_api_key_field_html',
        'ai_cv_builder_settings',
        'aicvb_api_settings_section'
    );
}
add_action( 'admin_init', 'aicvb_settings_init' );

/**
 * Render the API key input field HTML.
 */
function aicvb_api_key_field_html() {
    $api_key = get_option( 'aicvb_gemini_api_key' ); // Keep option name for compatibility
    ?>
    <input type='password' name='aicvb_gemini_api_key' value='<?php echo esc_attr( $api_key ); ?>' class='regular-text'>
    <p class="description">Enter your API Key. This is required for the AI features to work.</p> 
    <?php
}

// Define the AI Provider API endpoint (model name and task might vary)
define( 'AICVB_GEMINI_API_ENDPOINT', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent' );

/**
 * Calls the Gemini API with the given prompt and settings.
 *
 * @param string $prompt The text prompt to send to the API.
 * @param array|null $generation_config Configuration for content generation (e.g., temperature, maxOutputTokens).
 * @param array|null $safety_settings Configuration for safety filters.
 * @return string|WP_Error The generated text content on success, or a WP_Error on failure.
 */
function aicvb_call_gemini_api( string $prompt_text, array $generation_config = null, array $safety_settings = null ) {
    $api_key = get_option( 'aicvb_gemini_api_key' ); // Option name remains for data continuity

    if ( empty( $api_key ) ) {
        return new WP_Error( 'api_key_missing', __( 'API Key is not configured.', 'ai-cv-builder' ) ); // Changed message
    }

    $api_url = AICVB_GEMINI_API_ENDPOINT . '?key=' . $api_key;

    // Construct the request body
    $request_body = [
        'contents' => [
            [
                'parts' => [
                    [
                        'text' => $prompt_text
                    ]
                ]
            ]
        ]
    ];

    if ( ! is_null( $generation_config ) ) {
        $request_body['generationConfig'] = $generation_config;
    }

    if ( ! is_null( $safety_settings ) ) {
        $request_body['safetySettings'] = $safety_settings;
    }

    $args = [
        'method'  => 'POST',
        'headers' => [
            'Content-Type' => 'application/json',
        ],
        'body'    => json_encode( $request_body ),
        'timeout' => 60, // Increase timeout for potentially long API calls
    ];

    $response = wp_remote_post( $api_url, $args );

    if ( is_wp_error( $response ) ) {
        return new WP_Error( 'api_request_failed', __( 'API request failed: ', 'ai-cv-builder' ) . $response->get_error_message() );
    }

    $response_code = wp_remote_retrieve_response_code( $response );
    $response_body = wp_remote_retrieve_body( $response );
    $decoded_body = json_decode( $response_body, true );

    if ( $response_code !== 200 ) {
        $error_message = __( 'API request error: ', 'ai-cv-builder' ) . $response_code;
        if ( isset( $decoded_body['error']['message'] ) ) {
            $error_message .= ' - ' . $decoded_body['error']['message'];
        }
        return new WP_Error( 'api_error_response', $error_message );
    }

    if ( ! isset( $decoded_body['candidates'][0]['content']['parts'][0]['text'] ) ) {
        // Try to find an error message in the response if the expected content is not there
        if (isset($decoded_body['promptFeedback']['blockReason'])) {
            return new WP_Error('api_blocked_content', __('Content generation blocked by API. Reason: ', 'ai-cv-builder') . $decoded_body['promptFeedback']['blockReason']);
        }
        if (isset($decoded_body['candidates'][0]['finishReason']) && $decoded_body['candidates'][0]['finishReason'] !== 'STOP') {
             return new WP_Error('api_finish_reason_not_stop', __('Content generation finished with reason: ', 'ai-cv-builder') . $decoded_body['candidates'][0]['finishReason']);
        }
        // A more generic error if the structure is unexpected.
        error_log('AI CV Builder - Unexpected API response structure: ' . $response_body);
        return new WP_Error( 'api_unexpected_response', __( 'Unexpected API response structure. Check logs for details.', 'ai-cv-builder' ) );
    }

    return $decoded_body['candidates'][0]['content']['parts'][0]['text'];
}

// Example basic safety settings (adjust as needed)
define( 'AICVB_DEFAULT_SAFETY_SETTINGS', [
    [
        'category' => 'HARM_CATEGORY_HARASSMENT',
        'threshold' => 'BLOCK_MEDIUM_AND_ABOVE',
    ],
    [
        'category' => 'HARM_CATEGORY_HATE_SPEECH',
        'threshold' => 'BLOCK_MEDIUM_AND_ABOVE',
    ],
    [
        'category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        'threshold' => 'BLOCK_MEDIUM_AND_ABOVE',
    ],
    [
        'category' => 'HARM_CATEGORY_DANGEROUS_CONTENT',
        'threshold' => 'BLOCK_MEDIUM_AND_ABOVE',
    ],
]);

// Example basic generation config (adjust as needed)
define( 'AICVB_DEFAULT_GENERATION_CONFIG', [
    'temperature' => 0.7,
    'maxOutputTokens' => 1024,
]);

// Quick test function (remove or comment out for production)
/*
add_action('admin_notices', function() {
    if (isset($_GET['aicvb_test_api'])) {
        $prompt = "Write a short story about a brave WordPress plugin.";
        $config = AICVB_DEFAULT_GENERATION_CONFIG;
        $safety = AICVB_DEFAULT_SAFETY_SETTINGS;
        
        // To test JSON output, you could modify the prompt and expected response structure slightly
        // For example, asking for a JSON response.
        // $prompt = "Generate a JSON object with a field 'story_title' and 'story_body' for a short story about a brave WordPress plugin.";
        // $config['responseMimeType'] = 'application/json'; // If the model supports this directly in config

        $result = aicvb_call_gemini_api($prompt, $config, $safety);

        if (is_wp_error($result)) {
            echo "<div class='notice notice-error'><p>API Test Error: " . esc_html($result->get_error_message()) . "</p></div>";
        } else {
            // If expecting JSON, you would json_decode $result here.
            // For text:
            echo "<div class='notice notice-success'><p>API Test Success! Response:</p><pre>" . esc_html($result) . "</pre></div>";
        }
    }
    echo "<p><a href='" . esc_url(add_query_arg('aicvb_test_api', '1')) . "'>Test Gemini API Call (Output as Admin Notice)</a></p>";
});
*/

/**
 * Handles the [ai_cv_builder_interface] shortcode.
 *
 * @param array $atts Shortcode attributes.
 * @param string|null $content Shortcode content.
 * @return string HTML output for the CV builder interface.
 */
function aicvb_shortcode_handler( $atts = [], $content = null ) {
    $api_key = get_option( 'aicvb_gemini_api_key' );
    if ( empty( $api_key ) ) {
        if ( current_user_can( 'manage_options' ) ) {
            return '<p style="color:red;">' .
                   __( 'AI CV Builder: API Key not configured. Please configure it in ', 'ai-cv-builder' ) .
                   '<a href="' . esc_url( admin_url( 'options-general.php?page=ai_cv_builder_settings' ) ) . '">' .
                   __( 'Settings > AI CV Builder', 'ai-cv-builder' ) .
                   '</a>.</p>';
        } else {
            return '<p style="color:red;">' . __( 'AI CV Builder is not yet configured.', 'ai-cv-builder' ) . '</p>';
        }
    }

    // Enqueue scripts and styles
    wp_enqueue_style( 'aicvb-main-style', plugin_dir_url( __FILE__ ) . 'assets/css/aicvb-main.css', [], '1.0.0' );
    wp_enqueue_script( 'aicvb-main-script', plugin_dir_url( __FILE__ ) . 'assets/js/aicvb-main.js', [], '1.0.0', true );

    // Localize script with necessary data
    wp_localize_script( 'aicvb-main-script', 'aicvb_params', [
        'ajax_url' => admin_url( 'admin-ajax.php' ),
        'nonce'    => wp_create_nonce( 'aicvb_ajax_nonce' ),
        // Add other params as needed
    ]);

    // Initial UI structure
    $output = ''; // Initialize output
    $output .= '<div style="text-align: right; margin-bottom: 10px;"><button id="aicvb-reset-cv-btn" class="button">' . __('Start New / Reset CV', 'ai-cv-builder') . '</button></div>';
    $output .= '<div id="aicvb-cv-builder-app-container">';
    $output .= '<h2>' . __( 'AI CV Builder', 'ai-cv-builder' ) . '</h2>';
    
    $output .= '<div id="aicvb-cv-builder-app">';
    
    // Initial Setup Form (will be hidden by JS once CV is generated/loaded)
    $output .= '<div id="aicvb-initial-setup-section">';
    $output .= '<h3>' . __( 'Start Your CV', 'ai-cv-builder' ) . '</h3>';
    $output .= '<form id="aicvb-initial-setup-form">';
    
    $output .= '<p>' . __( 'Start by providing your desired job title or a full job description. AI will help create a foundational CV for you.', 'ai-cv-builder') . '</p>';

    $output .= '<div>';
    $output .= '<input type="radio" id="aicvb-input-type-title" name="aicvb_input_type" value="title" checked>';
    $output .= '<label for="aicvb-input-type-title">' . __('Use Job Title', 'ai-cv-builder') . '</label>';
    $output .= '</div>';
    $output .= '<div>';
    $output .= '<input type="radio" id="aicvb-input-type-description" name="aicvb_input_type" value="description">';
    $output .= '<label for="aicvb-input-type-description">' . __('Use Job Description', 'ai-cv-builder') . '</label>';
    $output .= '</div>';

    $output .= '<div id="aicvb-job-title-field">';
    $output .= '<label for="aicvb-job-title">' . __( 'Desired Job Title', 'ai-cv-builder' ) . '</label>';
    $output .= '<input type="text" id="aicvb-job-title" name="aicvb_job_title" placeholder="' . __('e.g., Senior Software Engineer', 'ai-cv-builder') . '">';
    $output .= '</div>';

    $output .= '<div id="aicvb-job-description-field" class="aicvb-hidden">';
    $output .= '<label for="aicvb-job-description">' . __( 'Job Description', 'ai-cv-builder' ) . '</label>';
    $output .= '<textarea id="aicvb-job-description" name="aicvb_job_description" rows="6" placeholder="' . __('Paste the full job description here...', 'ai-cv-builder') . '"></textarea>';
    $output .= '</div>';
    
    $output .= '<button type="submit">' . __( 'Generate CV with AI', 'ai-cv-builder' ) . '</button>';
    $output .= '</form>';
    $output .= '</div>'; // #aicvb-initial-setup-section

    // Placeholder for CV display and editing sections (will be built by JS or further PHP)
    $output .= '<div id="aicvb-cv-display-edit-section" class="aicvb-hidden">';
    $output .= '<h3>' . __( 'Your CV', 'ai-cv-builder' ) . '</h3>';
    $output .= '<div id="aicvb-cv-preview"></div>';
    $output .= '<div id="aicvb-cv-editor-forms"></div>';
    $output .= '</div>'; // #aicvb-cv-display-edit-section

    $output .= '</div>'; // #aicvb-cv-builder-app
    $output .= '</div>'; // #aicvb-cv-builder-app-container

    return $output;
}

/**
 * Registers the shortcode for use.
 * This should be called directly in the plugin file, not within a hook,
 * unless it's an init hook with sufficient priority.
 */
function aicvb_register_shortcodes() {
    add_shortcode( 'ai_cv_builder_interface', 'aicvb_shortcode_handler' );
}
add_action('init', 'aicvb_register_shortcodes');

/**
 * Handles AJAX request for generating an initial CV.
 */
function aicvb_handle_generate_initial_cv_ajax() {
    // Verify nonce
    if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( $_POST['nonce'] ), 'aicvb_ajax_nonce' ) ) {
        wp_send_json_error( ['message' => __( 'Nonce verification failed.', 'ai-cv-builder' )], 403 );
        return;
    }

    if ( ! isset( $_POST['input_type'] ) || ! isset( $_POST['input_value'] ) ) {
        wp_send_json_error( ['message' => __( 'Missing input type or value.', 'ai-cv-builder' )], 400 );
        return;
    }

    $input_type = sanitize_text_field( $_POST['input_type'] );
    $input_value = sanitize_textarea_field( $_POST['input_value'] ); // Use textarea_field for potentially longer job descriptions

    if ( empty( $input_value ) ) {
        wp_send_json_error( ['message' => __( 'Input value cannot be empty.', 'ai-cv-builder' )], 400 );
        return;
    }
    
    $api_key = get_option( 'aicvb_gemini_api_key' );
    if (empty($api_key)) { // This check is actually redundant due to aicvb_call_gemini_api, but keep for direct calls if any.
         wp_send_json_error( ['message' => __( 'API Key is not configured.', 'ai-cv-builder' )], 500 );
        return;
    }

    // Construct a more detailed prompt asking for JSON output
    $prompt_text = "";
    if ($input_type === 'title') {
        $prompt_text = 'Based on the job title: "' . $input_value . '", generate a comprehensive CV structure.
The CV should include:
1. PersonalInfo: A JSON object with fields: "name" (string, set to "Your Name (Update Me!)"), "title" (string, set to the provided job title "' . $input_value . '"), "phone" (string, empty), "email" (string, empty), "linkedin" (string, empty), "github" (string, empty), "portfolio" (string, empty), "address" (string, empty).
2. Summary: A professional summary of 2-3 sentences relevant to the job title.
3. Experience: One sample experience entry. Include \'jobTitle\', \'company\', \'location\', \'startDate\', \'endDate\', and 2-3 \'responsibilities\' (bullet points).
4. Education: One sample education entry. Include \'degree\', \'institution\', \'location\', \'graduationDate\', and 1-2 \'details\'.
5. Skills: One skill entry with a \'category\' and a \'skills\' array with 3-4 relevant skills.
Respond ONLY with a single JSON object matching this structure: 
{"personalInfo": {"name": "", "title": "", "phone": "", "email": "", "linkedin": "", "github": "", "portfolio": "", "address": ""}, "summary": "", "experience": [{"jobTitle": "", "company": "", "location": "", "startDate": "", "endDate": "", "responsibilities": []}], "education": [{"degree": "", "institution": "", "location": "", "graduationDate": "", "details": []}], "skills": [{"category": "", "skills": []}]}
Ensure all string fields are populated appropriately based on the job title. Do not include \'id\' fields.';
    } else { // 'description'
        $prompt_text = 'Based on the following Job Description:
---
' . $input_value . '
---
Generate a comprehensive foundational CV structure. Extract the core job title from the Job Description for the PersonalInfo.title field.
The CV MUST include:
1. PersonalInfo: A JSON object with fields: "name" (string, set to "Your Name (Update Me!)"), "title" (string, set to the extracted core job title), "phone" (string, empty), "email" (string, empty), "linkedin" (string, empty), "github" (string, empty), "portfolio" (string, empty), "address" (string, empty).
2. Summary: A professional summary (2-3 sentences) highly relevant to the Job Description.
3. Experience: One or two sample experience entries aligned with the JD. Each entry MUST include: \'jobTitle\', \'company\', \'location\', \'startDate\', \'endDate\', and 2-3 \'responsibilities\'.
4. Education: One sample education entry. Include \'degree\', \'institution\', \'location\', \'graduationDate\', and 1-2 \'details\'.
5. Skills: One to two skill entries. Each with a \'category\' and a \'skills\' array with 3-5 skills directly extracted or inferred from the Job Description.
Respond ONLY with a single JSON object matching the structure described above. Do not include \'id\' fields.';
    }
    
    // Configuration to request JSON output from Gemini API
    $generation_config = array_merge(AICVB_DEFAULT_GENERATION_CONFIG, ['responseMimeType' => 'application/json']);

    $api_response = aicvb_call_gemini_api( $prompt_text, $generation_config, AICVB_DEFAULT_SAFETY_SETTINGS );

    if ( is_wp_error( $api_response ) ) {
        wp_send_json_error( ['message' => $api_response->get_error_message()], 500 );
        return;
    }

    // The API is now expected to return a JSON string directly because of responseMimeType
    $decoded_cv_data = json_decode( $api_response, true );

    if ( json_last_error() !== JSON_ERROR_NONE ) {
        error_log("AI CV Builder - Failed to decode JSON from API: " . json_last_error_msg() . " Raw response: " . $api_response); // Changed "from Gemini"
        wp_send_json_error( ['message' => __( 'Failed to parse AI response. The response was not valid JSON.', 'ai-cv-builder' ) . ' ' . json_last_error_msg() . $api_response], 500 );
        return;
    }
    
    // Basic validation of structure (can be expanded)
    if (!isset($decoded_cv_data['personalInfo']) || !isset($decoded_cv_data['summary'])) {
        error_log("AI CV Builder - Unexpected CV data structure from API: " . $api_response); // Changed "from Gemini"
        wp_send_json_error( ['message' => __( 'AI response has unexpected structure.', 'ai-cv-builder' )], 500 );
        return;
    }
    
    // Add unique IDs to sections that need them (experience, education, skills)
    // This is important for managing them in the UI later.
    if (isset($decoded_cv_data['experience']) && is_array($decoded_cv_data['experience'])) {
        foreach ($decoded_cv_data['experience'] as $key => $entry) {
            $decoded_cv_data['experience'][$key]['id'] = uniqid('exp_');
        }
    }
    if (isset($decoded_cv_data['education']) && is_array($decoded_cv_data['education'])) {
        foreach ($decoded_cv_data['education'] as $key => $entry) {
            $decoded_cv_data['education'][$key]['id'] = uniqid('edu_');
        }
    }
    if (isset($decoded_cv_data['skills']) && is_array($decoded_cv_data['skills'])) {
        foreach ($decoded_cv_data['skills'] as $key => $entry) {
            $decoded_cv_data['skills'][$key]['id'] = uniqid('skill_');
        }
    }

    wp_send_json_success( ['message' => 'CV data generated successfully!', 'cv_data' => $decoded_cv_data] );
}
add_action( 'wp_ajax_aicvb_generate_initial_cv', 'aicvb_handle_generate_initial_cv_ajax' );
// If you want to allow non-logged-in users (not typical for this kind of feature):
// add_action( 'wp_ajax_nopriv_aicvb_generate_initial_cv', 'aicvb_handle_generate_initial_cv_ajax' );


/**
 * Handles AJAX request for generating content for a specific CV section item.
 */
function aicvb_handle_generate_section_content_ajax() {
    // 1. Verify nonce
    if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( $_POST['nonce'] ), 'aicvb_ajax_nonce' ) ) {
        wp_send_json_error( ['message' => __( 'Nonce verification failed.', 'ai-cv-builder' )], 403 );
        return;
    }

    // 2. Sanitize input parameters
    $required_params = ['section_key', 'item_id', 'gen_context', 'item_data', 'full_cv_data'];
    foreach ($required_params as $param) {
        if ( ! isset( $_POST[$param] ) ) {
            wp_send_json_error( ['message' => __( 'Missing parameter: ', 'ai-cv-builder' ) . $param], 400 );
            return;
        }
    }

    $section_key = sanitize_text_field( $_POST['section_key'] );
    $item_id = sanitize_text_field( $_POST['item_id'] ); // Assuming item_id is a string like 'exp_xxxxx'
    $gen_context = sanitize_text_field( $_POST['gen_context'] );

    // item_data and full_cv_data are JSON strings, sanitize them carefully if needed, but json_decode will validate
    // Using wp_kses_post or similar might be too aggressive if the JSON contains legitimate HTML-like characters
    // For now, we rely on json_decode to validate and will sanitize the decoded data as needed.
    $item_data_json = stripslashes( $_POST['item_data'] ); // stripslashes is important as WP adds them
    $full_cv_data_json = stripslashes( $_POST['full_cv_data'] );

    $item_data = json_decode( $item_data_json, true );
    if ( json_last_error() !== JSON_ERROR_NONE ) {
        wp_send_json_error( ['message' => __( 'Invalid item_data JSON: ', 'ai-cv-builder' ) . json_last_error_msg()], 400 );
        return;
    }

    $full_cv_data = json_decode( $full_cv_data_json, true );
    if ( json_last_error() !== JSON_ERROR_NONE ) {
        wp_send_json_error( ['message' => __( 'Invalid full_cv_data JSON: ', 'ai-cv-builder' ) . json_last_error_msg()], 400 );
        return;
    }

    // 3. Construct prompt based on section_key and gen_context
    $prompt_text = "";
    $generation_config = AICVB_DEFAULT_GENERATION_CONFIG; // Start with default

    switch ( $section_key ) {
        case 'summary':
            // gen_context might not be relevant for summary, or could be 'overall'
            $prompt_text = "Based on the following CV data:\n" .
                           json_encode($full_cv_data, JSON_PRETTY_PRINT) . "\n\n" .
                           "Generate a concise and compelling professional summary (2-3 sentences).";
            // Plain text is fine for summary
            break;

        case 'experience':
            $job_title = isset($item_data['jobTitle']) ? sanitize_text_field($item_data['jobTitle']) : 'the role';
            $company_name = isset($item_data['company']) ? sanitize_text_field($item_data['company']) : 'the company';
            if ( $gen_context === 'responsibilities' ) {
                $prompt_text = "For the job title \"$job_title\" at \"$company_name\", generate 3-4 distinct key responsibilities or achievements as a JSON array of strings. " .
                               "Each responsibility should be concise and action-oriented. " .
                               "Example: [\"Developed new features for the company website.\", \"Managed a team of 5 engineers.\"]\n" .
                               "CV Context (for overall tone and style):\n" . json_encode($full_cv_data['summary'], JSON_PRETTY_PRINT) . "\n" . // Provide summary for context
                               "Respond ONLY with the JSON array of strings.";
                $generation_config['responseMimeType'] = 'application/json';
            } else {
                wp_send_json_error( ['message' => __( 'Invalid gen_context for experience: ', 'ai-cv-builder' ) . $gen_context], 400 );
                return;
            }
            break;

        case 'education':
            $degree = isset($item_data['degree']) ? sanitize_text_field($item_data['degree']) : 'the qualification';
            $institution = isset($item_data['institution']) ? sanitize_text_field($item_data['institution']) : 'the institution';
            if ( $gen_context === 'details' ) {
                $prompt_text = "For the degree \"$degree\" from \"$institution\", generate 1-2 academic details, projects, or achievements as a JSON array of strings. " .
                               "These should be concise and highlight relevant accomplishments. " .
                               "Example: [\"Graduated with Honors (GPA 3.8/4.0)\", \"Led a capstone project on renewable energy solutions.\"]\n" .
                               "CV Context (for overall tone and style):\n" . json_encode($full_cv_data['summary'], JSON_PRETTY_PRINT) . "\n" .
                               "Respond ONLY with the JSON array of strings.";
                $generation_config['responseMimeType'] = 'application/json';
            } else {
                wp_send_json_error( ['message' => __( 'Invalid gen_context for education: ', 'ai-cv-builder' ) . $gen_context], 400 );
                return;
            }
            break;

        case 'skills':
            $category_name = isset($item_data['category']) ? sanitize_text_field($item_data['category']) : 'this skill category';
            if ( $gen_context === 'skills' ) { // This context might seem redundant, but good for clarity
                $prompt_text = "For the skills category \"$category_name\", suggest 3-4 relevant skills as a JSON array of strings. " .
                               "Consider skills that would complement a CV with the following summary:\n" . json_encode($full_cv_data['summary'], JSON_PRETTY_PRINT) . "\n" .
                               "Example: [\"Python\", \"JavaScript\", \"Project Management\", \"Agile Methodologies\"]\n" .
                               "Respond ONLY with the JSON array of strings.";
                $generation_config['responseMimeType'] = 'application/json';
            } else {
                wp_send_json_error( ['message' => __( 'Invalid gen_context for skills: ', 'ai-cv-builder' ) . $gen_context], 400 );
                return;
            }
            break;

        default:
            wp_send_json_error( ['message' => __( 'Invalid section_key: ', 'ai-cv-builder' ) . $section_key], 400 );
            return;
    }

    if ( empty( $prompt_text ) ) {
        wp_send_json_error( ['message' => __( 'Failed to generate prompt.', 'ai-cv-builder' )], 500 );
        return;
    }

    // 5. Call aicvb_call_gemini_api
    $api_response = aicvb_call_gemini_api( $prompt_text, $generation_config, AICVB_DEFAULT_SAFETY_SETTINGS );

    if ( is_wp_error( $api_response ) ) {
        wp_send_json_error( ['message' => $api_response->get_error_message()], 500 );
        return;
    }

    // 6. Process API response
    $generated_content = null;
    if (isset($generation_config['responseMimeType']) && $generation_config['responseMimeType'] === 'application/json') {
        $decoded_response = json_decode( $api_response, true );
        if ( json_last_error() !== JSON_ERROR_NONE ) {
            // Attempt to clean the response: sometimes the API might return JSON wrapped in ```json ... ```
            $cleaned_response = preg_replace('/^```json\s*(.*)\s*```$/s', '$1', $api_response);
            $decoded_response = json_decode( $cleaned_response, true );

            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log("AI CV Builder - Failed to decode JSON from section content API: " . json_last_error_msg() . " Raw response: " . $api_response);
                wp_send_json_error( ['message' => __( 'Failed to parse AI response as JSON. Raw: ', 'ai-cv-builder' ) . $api_response ], 500 );
                return;
            }
        }
        $generated_content = $decoded_response; // This should be an array (e.g., of responsibilities or skills)
    } else {
        $generated_content = $api_response; // Plain text (e.g., for summary)
    }

    if (empty($generated_content)) {
        wp_send_json_error( ['message' => __( 'AI returned empty content.', 'ai-cv-builder' )], 500 );
        return;
    }

    // 7. Return generated content
    wp_send_json_success( ['generated_content' => $generated_content] );
}
add_action( 'wp_ajax_aicvb_generate_section_content', 'aicvb_handle_generate_section_content_ajax' );
// add_action( 'wp_ajax_nopriv_aicvb_generate_section_content', 'aicvb_handle_generate_section_content_ajax' ); // If needed
