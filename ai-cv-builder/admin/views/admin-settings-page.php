<?php
/**
 * Provides the admin area view for the plugin
 *
 * This file is used to markup the admin-facing aspects of the plugin.
 *
 * @link       https://yourwebsite.com
 * @since      1.0.0
 *
 * @package    Ai_Cv_Builder
 * @subpackage Ai_Cv_Builder/admin/views
 */

// Ensure the file is not accessed directly.
if ( ! defined( 'WPINC' ) ) {
    die;
}

?>
<div class="wrap">
    <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
    <form method="post" action="options.php">
        <?php
        // This prints out all hidden setting fields
        settings_fields( 'ai_cv_builder_options' ); // Must match the option group in Ai_Cv_Builder_Admin

        // This prints out all settings sections and fields for the page.
        // The page slug must match the one used in add_settings_section and add_settings_field.
        do_settings_sections( 'ai-cv-builder-settings' );

        // This prints the submit button
        submit_button( __( 'Save API Key', 'ai-cv-builder' ) );
        ?>
    </form>
</div>
