<?php

/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the admin area.
 *
 * @link       https://yourwebsite.com
 * @since      1.0.0
 *
 * @package    Ai_Cv_Builder
 * @subpackage Ai_Cv_Builder/includes
 */

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also Maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @package    Ai_Cv_Builder
 * @subpackage Ai_Cv_Builder/includes
 * @author     Your Name <email@example.com>
 */
class Ai_Cv_Builder {

    /**
     * The loader that's responsible for maintaining and registering all hooks that power
     * the plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      Ai_Cv_Builder_Loader    $loader    Maintains and registers all hooks for the plugin.
     */
    protected $loader;

    /**
     * The unique identifier of this plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      string    $plugin_name    The string used to uniquely identify this plugin.
     */
    protected $plugin_name;

    /**
     * The current version of the plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      string    $version    The current version of the plugin.
     */
    protected $version;

    /**
     * Define the core functionality of the plugin.
     *
     * Set the plugin name and the plugin version that can be used throughout the plugin.
     * Load the dependencies, define the locale, and set the hooks for the admin area and
     * the public-facing side of the site.
     *
     * @since    1.0.0
     */
    public function __construct() {
        if ( defined( 'AI_CV_BUILDER_VERSION' ) ) {
            $this->version = AI_CV_BUILDER_VERSION;
        } else {
            $this->version = '1.0.0';
        }
        $this->plugin_name = 'ai-cv-builder';

        $this->load_dependencies();
        $this->set_locale();
        $this->define_admin_hooks();
        $this->define_public_hooks();
        $this->define_ajax_hooks(); // Added for AJAX handling

    }

    /**
     * Load the required dependencies for this plugin.
     *
     * Include the following files that make up the plugin:
     *
     * - Ai_Cv_Builder_Loader. Orchestrates the hooks of the plugin.
     * - Ai_Cv_Builder_i18n. Defines internationalization functionality.
     * - Ai_Cv_Builder_Admin. Defines all hooks for the admin area.
     * - Ai_Cv_Builder_Public. Defines all hooks for the public side of the site.
     * - Ai_Cv_Builder_Ajax_Handler. Defines all hooks for AJAX operations.
     *
     * Create an instance of the loader which will be used to register the hooks
     * with WordPress.
     *
     * @since    1.0.0
     * @access   private
     */
    private function load_dependencies() {

        /**
         * The class responsible for orchestrating the actions and filters of the
         * core plugin.
         */
        require_once AI_CV_BUILDER_PLUGIN_DIR . 'includes/class-ai-cv-builder-loader.php';

        /**
         * The class responsible for defining all actions that occur in the admin area.
         */
        require_once AI_CV_BUILDER_PLUGIN_DIR . 'admin/class-ai-cv-builder-admin.php';

        /**
         * The class responsible for defining all actions that occur in the public-facing
         * side of the site.
         */
        require_once AI_CV_BUILDER_PLUGIN_DIR . 'public/class-ai-cv-builder-public.php';

        /**
         * The class responsible for handling AJAX requests.
         */
        require_once AI_CV_BUILDER_PLUGIN_DIR . 'includes/class-ai-cv-builder-ajax-handler.php';


        $this->loader = new Ai_Cv_Builder_Loader();

    }

    /**
     * Define the locale for this plugin for internationalization.
     *
     * Uses the Ai_Cv_Builder_i18n class in order to set the domain and to register the hook
     * with WordPress.
     *
     * @since    1.0.0
     * @access   private
     */
    private function set_locale() {
        // Internationalization functionality can be added here later if needed.
        // For now, this can be a placeholder.
        // require_once AI_CV_BUILDER_PLUGIN_DIR . 'includes/class-ai-cv-builder-i18n.php';
        // $plugin_i18n = new Ai_Cv_Builder_i18n();
        // $this->loader->add_action( 'plugins_loaded', $plugin_i18n, 'load_plugin_textdomain' );
    }

    /**
     * Register all of the hooks related to the admin area functionality
     * of the plugin.
     *
     * @since    1.0.0
     * @access   private
     */
    private function define_admin_hooks() {
        $plugin_admin = new Ai_Cv_Builder_Admin( $this->get_plugin_name(), $this->get_version() );
        // Add hooks for admin area (e.g., menu pages, settings)
        $this->loader->add_action( 'admin_menu', $plugin_admin, 'add_admin_menu' );
        $this->loader->add_action( 'admin_init', $plugin_admin, 'register_settings' );
        $this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_styles' );
        $this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_scripts' );
    }

    /**
     * Register all of the hooks related to the public-facing functionality
     * of the plugin.
     *
     * @since    1.0.0
     * @access   private
     */
    private function define_public_hooks() {
        $plugin_public = new Ai_Cv_Builder_Public( $this->get_plugin_name(), $this->get_version() );
        // Add hooks for public area (e.g., shortcodes, enqueuing scripts/styles for the app)
        $this->loader->add_action( 'init', $plugin_public, 'register_shortcodes' );
        $this->loader->add_action( 'wp_enqueue_scripts', $plugin_public, 'enqueue_styles' );
        $this->loader->add_action( 'wp_enqueue_scripts', $plugin_public, 'enqueue_scripts' );
    }

    /**
     * Register all of the hooks related to AJAX functionality.
     *
     * @since    1.0.0
     * @access   private
     */
    private function define_ajax_hooks() {
        $ajax_handler = new Ai_Cv_Builder_Ajax_Handler( $this->get_plugin_name(), $this->get_version() );
        // Hook for generating CV content
        $this->loader->add_action( 'wp_ajax_ai_cv_generate_content', $ajax_handler, 'handle_generate_content' );
        // If you want to allow non-logged-in users to use this, also add:
        // $this->loader->add_action( 'wp_ajax_nopriv_ai_cv_generate_content', $ajax_handler, 'handle_generate_content' );
    }


    /**
     * Run the loader to execute all of the hooks with WordPress.
     *
     * @since    1.0.0
     */
    public function run() {
        $this->loader->run();
    }

    /**
     * The name of the plugin used to uniquely identify it within the context of
     * WordPress and to define internationalization functionality.
     *
     * @since     1.0.0
     * @return    string    The name of the plugin.
     */
    public function get_plugin_name() {
        return $this->plugin_name;
    }

    /**
     * The reference to the class that orchestrates the hooks with the plugin.
     *
     * @since     1.0.0
     * @return    Ai_Cv_Builder_Loader    Orchestrates the hooks of the plugin.
     */
    public function get_loader() {
        return $this->loader;
    }

    /**
     * Retrieve the version number of the plugin.
     *
     * @since     1.0.0
     * @return    string    The version number of the plugin.
     */
    public function get_version() {
        return $this->version;
    }
}
