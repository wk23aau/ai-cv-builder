<?php
/**
 * AJAX handlers for Gemini CV Builder
 */

if (!defined('ABSPATH')) {
    exit;
}

class GCB_Ajax {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        // Public AJAX actions
        add_action('wp_ajax_gcb_save_cv', array($this, 'save_cv'));
        add_action('wp_ajax_gcb_load_cv', array($this, 'load_cv'));
        add_action('wp_ajax_gcb_generate_content', array($this, 'generate_content'));
        
        // Allow guest access if enabled
        $settings = get_option('gcb_settings', array());
        if (!empty($settings['allow_guest_usage'])) {
            add_action('wp_ajax_nopriv_gcb_generate_content', array($this, 'generate_content'));
        }
    }
    
    public function save_cv() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'gcb_nonce')) {
            wp_die('Security check failed');
        }
        
        // Check if user is logged in
        if (!is_user_logged_in()) {
            wp_send_json_error(array('message' => __('You must be logged in to save CVs.', 'gemini-cv-builder')));
        }
        
        // Get and validate data
        $cv_data = isset($_POST['cv_data']) ? json_decode(stripslashes($_POST['cv_data']), true) : array();
        $theme_data = isset($_POST['theme_data']) ? json_decode(stripslashes($_POST['theme_data']), true) : array();
        $cv_id = isset($_POST['cv_id']) ? intval($_POST['cv_id']) : 0;
        
        if (empty($cv_data)) {
            wp_send_json_error(array('message' => __('Invalid CV data.', 'gemini-cv-builder')));
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'gcb_saved_cvs';
        $user_id = get_current_user_id();
        
        // Prepare data
        $data = array(
            'user_id' => $user_id,
            'cv_data' => json_encode($cv_data),
            'theme_data' => json_encode($theme_data),
        );
        
if ($cv_id > 0) {
            // Update existing CV
            $where = array('id' => $cv_id, 'user_id' => $user_id);
            $result = $wpdb->update($table_name, $data, $where);
        } else {
            // Insert new CV
            $result = $wpdb->insert($table_name, $data);
            $cv_id = $wpdb->insert_id;
        }
        
        if ($result !== false) {
            wp_send_json_success(array(
                'message' => __('CV saved successfully.', 'gemini-cv-builder'),
                'cv_id' => $cv_id
            ));
        } else {
            wp_send_json_error(array('message' => __('Failed to save CV.', 'gemini-cv-builder')));
        }
    }
    
    public function load_cv() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'gcb_nonce')) {
            wp_die('Security check failed');
        }
        
        // Check if user is logged in
        if (!is_user_logged_in()) {
            wp_send_json_error(array('message' => __('You must be logged in to load CVs.', 'gemini-cv-builder')));
        }
        
        $cv_id = isset($_POST['cv_id']) ? intval($_POST['cv_id']) : 0;
        
        if (!$cv_id) {
            wp_send_json_error(array('message' => __('Invalid CV ID.', 'gemini-cv-builder')));
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'gcb_saved_cvs';
        $user_id = get_current_user_id();
        
        $cv = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE id = %d AND user_id = %d",
            $cv_id,
            $user_id
        ));
        
        if ($cv) {
            wp_send_json_success(array(
                'cv_data' => json_decode($cv->cv_data, true),
                'theme_data' => json_decode($cv->theme_data, true),
            ));
        } else {
            wp_send_json_error(array('message' => __('CV not found.', 'gemini-cv-builder')));
        }
    }
    
    public function generate_content() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'gcb_nonce')) {
            wp_die('Security check failed');
        }
        
        // Check rate limiting
        if (!$this->check_rate_limit()) {
            wp_send_json_error(array('message' => __('Rate limit exceeded. Please try again later.', 'gemini-cv-builder')));
        }
        
        // Get request data
        $generation_type = isset($_POST['generation_type']) ? sanitize_text_field($_POST['generation_type']) : '';
        $prompt = isset($_POST['prompt']) ? sanitize_textarea_field($_POST['prompt']) : '';
        $context = isset($_POST['context']) ? json_decode(stripslashes($_POST['context']), true) : array();
        
        // Validate input
        if (empty($generation_type) || empty($prompt)) {
            wp_send_json_error(array('message' => __('Invalid request parameters.', 'gemini-cv-builder')));
        }
        
        // Make request to Gemini API (this would be handled by the JavaScript side)
        // Since we're keeping the Gemini API calls client-side for security,
        // we'll just validate and pass through here
        
        // Record the API usage
        $this->record_api_usage();
        
        wp_send_json_success(array(
            'message' => __('Request validated. Process on client side.', 'gemini-cv-builder'),
            'can_proceed' => true
        ));
    }
    
    private function check_rate_limit() {
        $settings = get_option('gcb_settings', array());
        $rate_limit = isset($settings['rate_limit']) ? intval($settings['rate_limit']) : 10;
        
        $user_identifier = is_user_logged_in() ? 'user_' . get_current_user_id() : 'ip_' . $_SERVER['REMOTE_ADDR'];
        $transient_key = 'gcb_rate_limit_' . md5($user_identifier);
        
        $current_count = get_transient($transient_key);
        
        if ($current_count === false) {
            set_transient($transient_key, 1, HOUR_IN_SECONDS);
            return true;
        }
        
        if ($current_count >= $rate_limit) {
            return false;
        }
        
        set_transient($transient_key, $current_count + 1, HOUR_IN_SECONDS);
        return true;
    }
    
    private function record_api_usage() {
        // Optionally record API usage for analytics
        $user_id = get_current_user_id();
        $usage_data = array(
            'user_id' => $user_id,
            'ip_address' => $_SERVER['REMOTE_ADDR'],
            'timestamp' => current_time('mysql'),
        );
        
        // You could save this to a custom table or use WordPress options
        // For now, we'll just use a transient for basic tracking
        $usage_log = get_transient('gcb_api_usage_log');
        if (!is_array($usage_log)) {
            $usage_log = array();
        }
        
        $usage_log[] = $usage_data;
        
        // Keep only last 1000 entries
        if (count($usage_log) > 1000) {
            $usage_log = array_slice($usage_log, -1000);
        }
        
        set_transient('gcb_api_usage_log', $usage_log, WEEK_IN_SECONDS);
    }
}