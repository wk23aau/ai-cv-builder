<?php
/**
 * Fired during plugin deactivation
 *
 * @link       https://yourwebsite.com
 * @since      1.0.0
 *
 * @package    Ai_Cv_Builder
 * @subpackage Ai_Cv_Builder/includes
 */

/**
 * Fired during plugin deactivation.
 *
 * This class defines all code necessary to run during the plugin's deactivation.
 *
 * @since      1.0.0
 * @package    Ai_Cv_Builder
 * @subpackage Ai_Cv_Builder/includes
 * @author     Your Name <email@example.com>
 */
class Ai_Cv_Builder_Deactivator {

    /**
     * Short Description. (use period)
     *
     * Long Description.
     *
     * @since    1.0.0
     */
    public static function deactivate() {
        // Add any deactivation logic here if needed.
        // For example, deleting options (though usually not recommended for API keys unless specifically requested)
        // delete_option( 'ai_cv_builder_gemini_api_key' );
    }
}
