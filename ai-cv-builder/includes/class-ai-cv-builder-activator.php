<?php
/**
 * Fired during plugin activation
 *
 * @link       https://yourwebsite.com
 * @since      1.0.0
 *
 * @package    Ai_Cv_Builder
 * @subpackage Ai_Cv_Builder/includes
 */

/**
 * Fired during plugin activation.
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    Ai_Cv_Builder
 * @subpackage Ai_Cv_Builder/includes
 * @author     Your Name <email@example.com>
 */
class Ai_Cv_Builder_Activator {

    /**
     * Actions to perform on plugin activation.
     *
     * This method is called when the plugin is activated.
     * It ensures that a default option for the Gemini API key is set if not already present.
     *
     * @since    1.0.0
     */
    public static function activate() {
        // Option name for the Gemini API Key
        $api_key_option_name = 'ai_cv_builder_gemini_api_key';

        // Check if the option already exists
        if ( get_option( $api_key_option_name ) === false ) {
            // Add the option with a default empty string value
            update_option( $api_key_option_name, '' );
        }

        // Other activation tasks (like flushing rewrite rules if CPTs were used) can go here.
        // For this plugin, setting the default option is the primary task.
    }
}
