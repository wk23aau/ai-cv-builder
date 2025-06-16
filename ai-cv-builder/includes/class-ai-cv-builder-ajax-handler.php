<?php
/**
 * Handles AJAX requests for the AI CV Builder plugin.
 *
 * @link       https://yourwebsite.com
 * @since      1.0.0
 *
 * @package    Ai_Cv_Builder
 * @subpackage Ai_Cv_Builder/includes
 */

class Ai_Cv_Builder_Ajax_Handler {

    private $plugin_name;
    private $version;
    private $gemini_api_key_option = 'ai_cv_builder_gemini_api_key';

    // TODO: Confirm the correct Gemini API endpoint. This is a placeholder.
    // Example for a specific model, adjust as per Gemini documentation.
    private $gemini_api_base_url = 'https://generativelanguage.googleapis.com/v1beta/models/';


    /**
     * Initialize the class and set its properties.
     *
     * @since    1.0.0
     * @param      string    $plugin_name       The name of the plugin.
     * @param      string    $version    The version of this plugin.
     */
    public function __construct( $plugin_name, $version ) {
        $this->plugin_name = $plugin_name;
        $this->version = $version;
    }

    /**
     * Handles the AJAX request for generating CV content.
     */
    public function handle_generate_content() {
        // Nonce check for security. The nonce name must match what was created in Ai_Cv_Builder_Public.
        check_ajax_referer( $this->plugin_name . '_nonce', 'nonce' );

        // Get API Key
        $api_key = get_option( $this->gemini_api_key_option );
        if ( empty( $api_key ) ) {
            wp_send_json_error( array( 'message' => __( 'Gemini API key is not configured in plugin settings.', 'ai-cv-builder' ) ), 400 );
            return;
        }

        // Get and sanitize parameters from the frontend
        $section_type = isset( $_POST['sectionType'] ) ? sanitize_text_field( $_POST['sectionType'] ) : null;
        $user_input = isset( $_POST['userInput'] ) ? sanitize_textarea_field( $_POST['userInput'] ) : null; // Using sanitize_textarea_field for potentially longer inputs
        $context_json = isset( $_POST['context'] ) ? stripslashes( $_POST['context'] ) : null; // Context is a JSON string

        if ( ! $section_type || ! $user_input ) {
            wp_send_json_error( array( 'message' => __( 'Missing required parameters (sectionType or userInput).', 'ai-cv-builder' ) ), 400 );
            return;
        }

        $context = array();
        if ( $context_json ) {
            $decoded_context = json_decode( $context_json, true );
            if ( json_last_error() === JSON_ERROR_NONE ) {
                // Sanitize context array elements - example, adjust based on expected structure
                // This is a basic sanitization. For nested arrays/objects, more specific sanitization is needed.
                $context = array_map( 'sanitize_text_field', $decoded_context );
            } else {
                wp_send_json_error( array( 'message' => __( 'Invalid context JSON provided.', 'ai-cv-builder' ), 'details' => json_last_error_msg() ), 400 );
                return;
            }
        }

        // Construct Gemini API request
        // IMPORTANT: This is a generic structure. You MUST adapt this to the specific Gemini API model and its requirements.
        // Refer to the official Gemini API documentation for the correct endpoint, request body, and headers.

        $prompt_text = $this->build_prompt( $section_type, $user_input, $context );

        // Example: Using a specific model like 'gemini-pro:generateContent'
        // The model name might differ based on your needs (e.g., 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest')
        $model = 'gemini-pro'; // Choose the appropriate model
        $api_url = $this->gemini_api_base_url . $model . ':generateContent?key=' . $api_key;

        $request_body = array(
            'contents' => array(
                array(
                    'parts' => array(
                        array( 'text' => $prompt_text )
                    )
                )
            ),
            // Add generationConfig if needed (e.g., temperature, maxOutputTokens)
            // 'generationConfig' => array(
            //   'temperature' => 0.7,
            //   'maxOutputTokens' => 1000,
            // )
        );

        $args = array(
            'method'  => 'POST',
            'headers' => array(
                'Content-Type' => 'application/json',
            ),
            'body'    => json_encode( $request_body ),
            'timeout' => 60, // Increase timeout for potentially long API calls
        );

        $response = wp_remote_post( $api_url, $args );

        if ( is_wp_error( $response ) ) {
            wp_send_json_error( array( 'message' => __( 'Failed to connect to Gemini API.', 'ai-cv-builder' ), 'details' => $response->get_error_message() ), 500 );
            return;
        }

        $response_code = wp_remote_retrieve_response_code( $response );
        $response_body = wp_remote_retrieve_body( $response );
        $decoded_body = json_decode( $response_body, true );

        if ( $response_code !== 200 ) {
            $error_message = __( 'Gemini API request failed.', 'ai-cv-builder' );
            $error_details = '';
            if ( isset( $decoded_body['error']['message'] ) ) {
                $error_details = $decoded_body['error']['message'];
            } else {
                $error_details = $response_body;
            }
            wp_send_json_error( array( 'message' => $error_message, 'details' => $error_details, 'status_code' => $response_code ), $response_code );
            return;
        }

        // Extract the generated content. This depends heavily on the Gemini API response structure.
        // Example assumes response like: { "candidates": [ { "content": { "parts": [ { "text": "Generated text..." } ] } } ] }
        $generated_text = '';
        if ( isset( $decoded_body['candidates'][0]['content']['parts'][0]['text'] ) ) {
            $generated_text = $decoded_body['candidates'][0]['content']['parts'][0]['text'];
        } else {
            wp_send_json_error( array( 'message' => __( 'Could not parse generated content from Gemini API response.', 'ai-cv-builder' ), 'details' => $response_body ), 500 );
            return;
        }

        // The frontend's geminiService.ts expects specific data structures for certain sectionTypes.
        // The PHP backend should try to match these structures or the frontend needs to adapt.
        // For simplicity, this example primarily returns the text.
        // More complex parsing and structuring might be needed here based on `section_type`.

        // Example: if section_type needs a specific object structure, build it here.
        // For now, we send back the raw generated text for most cases,
        // or an object if the original service expects it (e.g. for new entries, this needs more logic)

        // This is a simplified output. The original geminiService.ts has client-side logic
        // to structure data (e.g., adding IDs). Ideally, PHP should return data as close to final as possible.
        // For now, we'll keep it simple and let the frontend handle some structuring if it was already doing so.
        // The key is that `jsonResponse.data` in `geminiService.ts` gets what it expects.

        $output_data = $this->structure_output_for_frontend($generated_text, $section_type, $context);

        wp_send_json_success( $output_data );
    }

    /**
     * Builds a prompt for the Gemini API based on section type and inputs.
     * This is a placeholder and needs to be significantly expanded.
     *
     * @param string $section_type Type of content to generate.
     * @param string $user_input User's primary input.
     * @param array $context Additional context.
     * @return string The constructed prompt.
     */
    private function build_prompt( $section_type, $user_input, $context ) {
        // This is highly dependent on how you want to interact with Gemini.
        // You'll need to craft prompts that make sense for each `section_type`.
        $prompt = "You are an AI assistant helping to build a CV.
";
        $job_title = isset($context['jobTitle']) ? $context['jobTitle'] : '';
        $job_description = isset($context['jobDescription']) ? $context['jobDescription'] : '';

        switch ( $section_type ) {
            case 'summary':
                $prompt .= "Generate a professional summary for a CV. The user's input is: "{$user_input}".";
                if ($job_title) $prompt .= " The target job title is "{$job_title}".";
                break;
            case 'responsibilities': // for an experience entry
                $prompt .= "Generate 3-5 bullet points for responsibilities and achievements for a job role. The user's input (job title/company/details) is: "{$user_input}".";
                if ($job_title) $prompt .= " This is for a role as "{$job_title}".";
                $prompt .= "
Return as a JSON array of strings. Example: ["Responsibility 1", "Responsibility 2"]";
                break;
            case 'skills_suggestions':
                $prompt .= "Suggest relevant skills for a CV based on the following input: "{$user_input}".";
                if ($job_title) $prompt .= " The target job title is "{$job_title}".";
                $prompt .= "
Return as a JSON array of strings. Example: ["Skill 1", "Skill 2"]";
                break;
            case 'new_experience_entry':
                 $prompt .= "Based on the input: "{$user_input}", generate a structured experience entry for a CV. " .
                           "Include 'jobTitle', 'company', 'location', 'startDate', 'endDate', and an array of 'responsibilities' (strings). " .
                           "Return as a JSON object. Example: {"jobTitle": "Software Engineer", "company": "Tech Corp", "location": "City, ST", "startDate": "Jan 2020", "endDate": "Present", "responsibilities": ["Developed features", "Fixed bugs"]}";
                break;
            case 'new_education_entry':
                $prompt .= "Based on the input: "{$user_input}", generate a structured education entry for a CV. " .
                           "Include 'degree', 'institution', 'location', 'graduationDate', and optionally 'details'. " .
                           "Return as a JSON object. Example: {"degree": "B.S. Computer Science", "institution": "State University", "location": "City, ST", "graduationDate": "May 2019", "details": "Relevant coursework..."}";
                break;
            case 'initial_cv_from_title':
                 $prompt .= "Generate a basic but complete CV structure based on the job title: "{$user_input}". " .
                           "Include sections for 'contact' (name, phone, email, linkedin - make them placeholders), 'summary', 'experience' (array of 1-2 example entries with jobTitle, company, location, startDate, endDate, responsibilities array), 'education' (array of 1 example entry with degree, institution, graduationDate), and 'skills' (array of example skill objects like {"name": "Skill Name", "level": "Intermediate"}). " .
                           "Return as a single JSON object representing the CV data.";
                break;
            case 'initial_cv_from_job_description':
                $prompt .= "Generate a basic CV structure tailored to the following job description: "{$job_description}". " .
                           "The user's initial input (e.g. name, desired role) is "{$user_input}". " .
                           "Include sections for 'contact' (name, phone, email, linkedin - use user input if provided for name, else placeholder), 'summary' (tailored), 'experience' (array of 1-2 relevant example entries), 'education' (array of 1 example entry), and 'skills' (array of relevant skill objects {"name": "Skill Name", "level": "Intermediate"}). " .
                           "Return as a single JSON object representing the CV data.";
                break;
            case 'tailor_cv_to_job_description':
                // This is complex. The existing CV data needs to be sent.
                // The 'context' should contain 'existingCV' (JSON string) and 'jobDescription'.
                $existing_cv_json = isset($context['existingCV']) ? stripslashes($context['existingCV']) : '{}'; // Assuming context['existingCV'] is a JSON string from frontend
                $prompt .= "You are an expert CV editor. Review the following existing CV (JSON format):
{$existing_cv_json}

" .
                           "Now, tailor this CV to better match the following job description:
{$job_description}

" .
                           "Focus on improving the summary, suggesting updated responsibilities for existing experience entries, adding new targeted experience entries if appropriate, and suggesting relevant skills. " .
                           "Return a JSON object with fields like 'updatedSummary' (string), 'updatedExperience' (array of full experience entries, including original ones that are modified and new ones), 'newExperienceSuggestions' (array of new experience entries if any, separate from updatedExperience if that's easier), 'updatedSkills' (array of skill objects). The user's general input/request is: "{$user_input}".";
                           // This prompt needs careful crafting and the response structure needs to align with `TailoredCVUpdate` type in TS.
                break;
            // Add more cases for other section_types from your frontend
            default:
                $prompt .= "Generate content for a CV section of type '{$section_type}' based on user input: "{$user_input}".";
                if ($job_title) $prompt .= " The target job title is "{$job_title}".";
        }
        return $prompt;
    }

    /**
     * Structures the API response for the frontend, attempting to match geminiService.ts expectations.
     *
     * @param string $generated_text Raw text from Gemini.
     * @param string $section_type The section type being processed.
     * @param array $context The context received from the frontend.
     * @return mixed Structured data or raw text.
     */
    private function structure_output_for_frontend($generated_text, $section_type, $context){
        // Try to parse JSON if the prompt requested it (e.g. for responsibilities, new entries)
        $decoded_json = json_decode($generated_text, true);

        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded_json)) {
            // If Gemini returned valid JSON, use that.
            // This is crucial for types like 'new_experience_entry', 'new_education_entry', 'initial_cv_...', 'tailor_cv_...'
             if (in_array($section_type, [
                'new_experience_entry',
                'new_education_entry',
                'initial_cv_from_title',
                'initial_cv_from_job_description',
                'tailor_cv_to_job_description'
                ])) {
                // For these types, the frontend expects an object.
                // Ensure the generated JSON matches the structure expected by `geminiService.ts` for these types.
                // For example, `initial_cv_...` should return a full CVData object.
                // `tailor_cv_...` should return a `TailoredCVUpdate` like object.
                return $decoded_json;
            } elseif ($section_type === 'responsibilities' || $section_type === 'skills_suggestions') {
                // These expect an array of strings.
                if (is_array($decoded_json) && array_reduce($decoded_json, function ($is_strings, $item) { return $is_strings && is_string($item); }, true)) {
                    return $decoded_json;
                }
            }
            // If it's JSON but not matching a specific structure needed above, pass it as is.
            // Or, you might want to fall back to text if it's not the expected array/object.
            // For now, returning the decoded JSON if parsing was successful.
            return $decoded_json;
        }

        // Default: return the raw text if not specific JSON structure was expected or if JSON parsing failed
        return $generated_text;
    }
}
