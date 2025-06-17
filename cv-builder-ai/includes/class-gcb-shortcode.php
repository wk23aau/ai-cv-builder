<?php
/**
 * Shortcode functionality for Gemini CV Builder
 */

if (!defined('ABSPATH')) {
    exit;
}

class GCB_Shortcode {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_shortcode('gemini_cv_builder', array($this, 'render_shortcode'));
    }
    
    public function render_shortcode($atts) {
        // Parse shortcode attributes
        $atts = shortcode_atts(array(
            'theme' => 'default',
            'allow_save' => null,
            'container_class' => '',
        ), $atts, 'gemini_cv_builder');
        
        // Check permissions
        $settings = get_option('gcb_settings', array());
        if (!is_user_logged_in() && empty($settings['allow_guest_usage'])) {
            return '<div class="gcb-error">' . __('Please log in to use the CV Builder.', 'gemini-cv-builder') . '</div>';
        }
        
        // Generate unique container ID
        $container_id = 'gcb-container-' . uniqid();
        
        // Prepare data for React app
        $app_data = array(
            'containerId' => $container_id,
            'theme' => sanitize_text_field($atts['theme']),
            'allowSave' => $atts['allow_save'] !== null ? filter_var($atts['allow_save'], FILTER_VALIDATE_BOOLEAN) : $settings['enable_save_feature'],
            'apiKey' => get_option('gcb_gemini_api_key', ''),
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('gcb_nonce'),
            'userId' => get_current_user_id(),
            'isLoggedIn' => is_user_logged_in(),
            'rateLimit' => isset($settings['rate_limit']) ? $settings['rate_limit'] : 10,
        );
        
        // Start output buffering
        ob_start();
        ?>
        <div id="<?php echo esc_attr($container_id); ?>" class="gcb-container <?php echo esc_attr($atts['container_class']); ?>">
            <div class="gcb-loading">
                <div class="gcb-spinner"></div>
                <p><?php _e('Loading CV Builder...', 'gemini-cv-builder'); ?></p>
            </div>
        </div>
        
        <script type="text/javascript">
            (function() {
                // Wait for dependencies to load
                function initGCBApp() {
                    if (typeof window.GeminiCVBuilder !== 'undefined' && typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
                        window.GeminiCVBuilder.init(<?php echo json_encode($app_data); ?>);
                    } else {
                        setTimeout(initGCBApp, 100);
                    }
                }
                
                // Initialize when DOM is ready
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', initGCBApp);
                } else {
                    initGCBApp();
                }
            })();
        </script>
        <?php
        
        return ob_get_clean();
    }
}