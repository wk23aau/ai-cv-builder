<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * @link       https://yourwebsite.com
 * @since      1.0.0
 *
 * @package    Ai_Cv_Builder
 * @subpackage Ai_Cv_Builder/admin
 */

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    Ai_Cv_Builder
 * @subpackage Ai_Cv_Builder/admin
 * @author     Your Name <email@example.com>
 */
class Ai_Cv_Builder_Admin {

    /**
     * The ID of this plugin.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $plugin_name    The ID of this plugin.
     */
    private $plugin_name;

    /**
     * The version of this plugin.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $version    The current version of this plugin.
     */
    private $version;

    /**
     * The slug for the admin settings page.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $settings_page_slug    The slug for the admin settings page.
     */
    private $settings_page_slug = 'ai-cv-builder-settings';

    /**
     * The option group for the settings API.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $option_group    The option group for the settings API.
     */
    private $option_group = 'ai_cv_builder_options';


    /**
     * Initialize the class and set its properties.
     *
     * @since    1.0.0
     * @param      string    $plugin_name       The name of this plugin.
     * @param      string    $version    The version of this plugin.
     */
    public function __construct( $plugin_name, $version ) {
        $this->plugin_name = $plugin_name;
        $this->version = $version;
    }

    /**
     * Register the stylesheets for the admin area.
     *
     * @since    1.0.0
     * @param string $hook_suffix The current admin page.
     */
    public function enqueue_styles( $hook_suffix ) {
        // Example:
        // if ( 'toplevel_page_' . $this->settings_page_slug === $hook_suffix ) {
        //     wp_enqueue_style( $this->plugin_name, AI_CV_BUILDER_PLUGIN_URL . 'admin/css/ai-cv-builder-admin.css', array(), $this->version, 'all' );
        // }
    }

    /**
     * Register the JavaScript for the admin area.
     *
     * @since    1.0.0
     * @param string $hook_suffix The current admin page.
     */
    public function enqueue_scripts( $hook_suffix ) {
        // Example:
        // if ( 'toplevel_page_' . $this->settings_page_slug === $hook_suffix ) {
        //     wp_enqueue_script( $this->plugin_name, AI_CV_BUILDER_PLUGIN_URL . 'admin/js/ai-cv-builder-admin.js', array( 'jquery' ), $this->version, false );
        // }
    }

    /**
     * Add the admin menu page for the plugin settings.
     *
     * @since    1.0.0
     */
    public function add_admin_menu() {
        add_menu_page(
            __( 'AI CV Builder Settings', 'ai-cv-builder' ), // Page Title
            __( 'AI CV Builder', 'ai-cv-builder' ),          // Menu Title
            'manage_options',                               // Capability
            $this->settings_page_slug,                      // Menu Slug
            array( $this, 'display_settings_page' ),        // Callback function
            'dashicons-text-page',                          // Icon URL
            75                                              // Position
        );
    }

    /**
     * Display the settings page.
     *
     * @since    1.0.0
     */
    public function display_settings_page() {
        // Check user capabilities
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }
        // The view file will handle the HTML structure.
        require_once AI_CV_BUILDER_PLUGIN_DIR . 'admin/views/admin-settings-page.php';
    }

    /**
     * Register the plugin settings using the Settings API.
     *
     * @since    1.0.0
     */
    public function register_settings() {
        // Register a setting section
        add_settings_section(
            'ai_cv_builder_gemini_api_section',                 // ID
            __( 'Gemini API Settings', 'ai-cv-builder' ),       // Title
            array( $this, 'render_api_section_text' ),          // Callback
            $this->settings_page_slug                           // Page on which to show the section
        );

        // Register the API Key setting field
        add_settings_field(
            'ai_cv_builder_gemini_api_key',                     // ID
            __( 'Gemini API Key', 'ai-cv-builder' ),            // Title
            array( $this, 'render_api_key_field' ),             // Callback to render the field
            $this->settings_page_slug,                          // Page
            'ai_cv_builder_gemini_api_section',                 // Section
            array( 'label_for' => 'ai_cv_builder_gemini_api_key_field' ) // Associates label with input
        );

        // Register the setting itself
        register_setting(
            $this->option_group,                                // Option group
            'ai_cv_builder_gemini_api_key',                     // Option name
            array( $this, 'sanitize_api_key' )                  // Sanitization callback
        );
    }

    /**
     * Render the text for the API settings section.
     *
     * @since    1.0.0
     * @param array $args Arguments passed to the callback.
     */
    public function render_api_section_text( $args ) {
        echo '<p>' . __( 'Enter your Gemini API Key below. This key is required for the CV builder to generate content.', 'ai-cv-builder' ) . '</p>';
        // You can retrieve and display the current key here for confirmation if desired, but be cautious about full key display.
        $api_key = get_option( 'ai_cv_builder_gemini_api_key' );
        if ( !empty($api_key) ) {
            echo '<p style="color: green;">' . __( 'API Key is configured.', 'ai-cv-builder' ) . '</p>';
        } else {
            echo '<p style="color: red;">' . __( 'API Key is NOT configured.', 'ai-cv-builder' ) . '</p>';
        }
    }

    /**
     * Render the API Key input field.
     *
     * @since    1.0.0
     * @param array $args Arguments passed to the callback.
     */
    public function render_api_key_field( $args ) {
        $option_name = 'ai_cv_builder_gemini_api_key';
        $api_key = get_option( $option_name );
        ?>
        <input type="password" id="<?php echo esc_attr( $args['label_for'] ); ?>" name="<?php echo esc_attr( $option_name ); ?>" value="<?php echo esc_attr( $api_key ); ?>" class="regular-text" />
        <p class="description">
            <?php esc_html_e( 'Your Gemini API key. Find how to get one', 'ai-cv-builder' ); ?>
            <a href="https://makersuite.google.com/app/apikey" target="_blank"><?php esc_html_e( 'here', 'ai-cv-builder' ); ?></a>.
        </p>
        <?php
    }

    /**
     * Sanitize the API key.
     *
     * @since    1.0.0
     * @param    string    $input    The API key input.
     * @return   string    Sanitized API key.
     */
    public function sanitize_api_key( $input ) {
        // Basic sanitization. You might want to add more specific validation if Gemini API keys have a known format.
        return sanitize_text_field( $input );
    }
}
