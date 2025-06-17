<?php
/**
 * Plugin Name: Gemini CV Builder
 * Plugin URI: https://yourwebsite.com/gemini-cv-builder
 * Description: AI-powered CV/Resume builder with Gemini API integration for WordPress
 * Version: 1.0.0
 * Author: Your Name
 * Author URI: https://yourwebsite.com
 * License: GPL v2 or later
 * Text Domain: gemini-cv-builder
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('GCB_PLUGIN_VERSION', '1.0.0');
define('GCB_PLUGIN_URL', plugin_dir_url(__FILE__));
define('GCB_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('GCB_PLUGIN_BASENAME', plugin_basename(__FILE__));

// Include required files
require_once GCB_PLUGIN_PATH . 'includes/class-gcb-admin.php';
require_once GCB_PLUGIN_PATH . 'includes/class-gcb-shortcode.php';
require_once GCB_PLUGIN_PATH . 'includes/class-gcb-ajax.php';

// Initialize the plugin
class Gemini_CV_Builder {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->init_hooks();
    }
    
    private function init_hooks() {
        // Activation/Deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        // Initialize components
        add_action('init', array($this, 'init'));
        
        // Enqueue scripts and styles
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_assets'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
    }
    
    public function activate() {
        // Create database tables if needed
        $this->create_tables();
        
        // Set default options
        add_option('gcb_gemini_api_key', '');
        add_option('gcb_settings', array(
            'enable_save_feature' => true,
            'allow_guest_usage' => true,
            'rate_limit' => 10, // requests per hour
        ));
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    public function deactivate() {
        // Clean up temporary data
        flush_rewrite_rules();
    }
    
    public function init() {
        // Initialize admin
        if (is_admin()) {
            GCB_Admin::get_instance();
        }
        
        // Initialize shortcode
        GCB_Shortcode::get_instance();
        
        // Initialize AJAX handlers
        GCB_Ajax::get_instance();
        
        // Load text domain
        load_plugin_textdomain('gemini-cv-builder', false, dirname(GCB_PLUGIN_BASENAME) . '/languages');
    }
    
    public function enqueue_frontend_assets() {
        global $post;
        
        // Only enqueue on pages with our shortcode
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'gemini_cv_builder')) {
            
            // Enqueue React and dependencies
            wp_enqueue_script('react', 'https://unpkg.com/react@18/umd/react.production.min.js', array(), '18.0.0', true);
            wp_enqueue_script('react-dom', 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', array('react'), '18.0.0', true);
            
            // Enqueue Tailwind CSS
            wp_enqueue_script('tailwindcss', 'https://cdn.tailwindcss.com', array(), null, false);
            
            // Enqueue html2pdf
            wp_enqueue_script('html2pdf', 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js', array(), '0.10.1', true);
            
            // Enqueue our bundled app
            wp_enqueue_script(
                'gcb-app',
                GCB_PLUGIN_URL . 'assets/js/app.bundle.js',
                array('react', 'react-dom', 'html2pdf'),
                GCB_PLUGIN_VERSION,
                true
            );
            
            // Enqueue styles
            wp_enqueue_style(
                'gcb-styles',
                GCB_PLUGIN_URL . 'assets/css/style.css',
                array(),
                GCB_PLUGIN_VERSION
            );
            
            // Localize script with data
            wp_localize_script('gcb-app', 'gcbData', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('gcb_nonce'),
                'api_key' => get_option('gcb_gemini_api_key', ''),
                'settings' => get_option('gcb_settings', array()),
                'user_id' => get_current_user_id(),
                'is_logged_in' => is_user_logged_in(),
            ));
        }
    }
    
    public function enqueue_admin_assets($hook) {
        // Only enqueue on our admin pages
        if (strpos($hook, 'gemini-cv-builder') === false) {
            return;
        }
        
        wp_enqueue_style(
            'gcb-admin-styles',
            GCB_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            GCB_PLUGIN_VERSION
        );
        
        wp_enqueue_script(
            'gcb-admin-script',
            GCB_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery'),
            GCB_PLUGIN_VERSION,
            true
        );
    }
    
    private function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Table for saving CV data
        $table_name = $wpdb->prefix . 'gcb_saved_cvs';
        
        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            cv_data longtext NOT NULL,
            theme_data longtext NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
}

// Initialize the plugin
Gemini_CV_Builder::get_instance();