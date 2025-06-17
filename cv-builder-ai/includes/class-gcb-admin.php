<?php
/**
 * Admin functionality for Gemini CV Builder
 */

if (!defined('ABSPATH')) {
    exit;
}

class GCB_Admin {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    public function add_admin_menu() {
        add_menu_page(
            __('Gemini CV Builder', 'gemini-cv-builder'),
            __('CV Builder', 'gemini-cv-builder'),
            'manage_options',
            'gemini-cv-builder',
            array($this, 'render_settings_page'),
            'dashicons-media-document',
            30
        );
        
        add_submenu_page(
            'gemini-cv-builder',
            __('Settings', 'gemini-cv-builder'),
            __('Settings', 'gemini-cv-builder'),
            'manage_options',
            'gemini-cv-builder',
            array($this, 'render_settings_page')
        );
        
        add_submenu_page(
            'gemini-cv-builder',
            __('Saved CVs', 'gemini-cv-builder'),
            __('Saved CVs', 'gemini-cv-builder'),
            'manage_options',
            'gcb-saved-cvs',
            array($this, 'render_saved_cvs_page')
        );
    }
    
    public function register_settings() {
        // Register API key setting
        register_setting('gcb_settings_group', 'gcb_gemini_api_key', array(
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => ''
        ));
        
        // Register general settings
        register_setting('gcb_settings_group', 'gcb_settings', array(
            'type' => 'array',
            'sanitize_callback' => array($this, 'sanitize_settings'),
            'default' => array(
                'enable_save_feature' => true,
                'allow_guest_usage' => true,
                'rate_limit' => 10,
            )
        ));
        
        // Add settings sections
        add_settings_section(
            'gcb_api_section',
            __('API Configuration', 'gemini-cv-builder'),
            array($this, 'render_api_section'),
            'gcb_settings'
        );
        
        add_settings_section(
            'gcb_general_section',
            __('General Settings', 'gemini-cv-builder'),
            array($this, 'render_general_section'),
            'gcb_settings'
        );
        
        // Add settings fields
        add_settings_field(
            'gcb_gemini_api_key',
            __('Gemini API Key', 'gemini-cv-builder'),
            array($this, 'render_api_key_field'),
            'gcb_settings',
            'gcb_api_section'
        );
        
        add_settings_field(
            'gcb_enable_save',
            __('Enable Save Feature', 'gemini-cv-builder'),
            array($this, 'render_enable_save_field'),
            'gcb_settings',
            'gcb_general_section'
        );
        
        add_settings_field(
            'gcb_allow_guest',
            __('Allow Guest Usage', 'gemini-cv-builder'),
            array($this, 'render_allow_guest_field'),
            'gcb_settings',
            'gcb_general_section'
        );
        
        add_settings_field(
            'gcb_rate_limit',
            __('Rate Limit (per hour)', 'gemini-cv-builder'),
            array($this, 'render_rate_limit_field'),
            'gcb_settings',
            'gcb_general_section'
        );
    }
    
    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <form method="post" action="options.php">
                <?php
                settings_fields('gcb_settings_group');
                do_settings_sections('gcb_settings');
                submit_button();
                ?>
            </form>
            
            <div class="gcb-shortcode-info">
                <h2><?php _e('How to Use', 'gemini-cv-builder'); ?></h2>
                <p><?php _e('To display the CV Builder on any page or post, use the following shortcode:', 'gemini-cv-builder'); ?></p>
                <code>[gemini_cv_builder]</code>
                
                <h3><?php _e('Shortcode Parameters:', 'gemini-cv-builder'); ?></h3>
                <ul>
                    <li><code>theme="modern"</code> - <?php _e('Set initial theme (default, modern, classic, creative)', 'gemini-cv-builder'); ?></li>
                    <li><code>allow_save="true"</code> - <?php _e('Override save feature setting', 'gemini-cv-builder'); ?></li>
                    <li><code>container_class="custom-class"</code> - <?php _e('Add custom CSS class to container', 'gemini-cv-builder'); ?></li>
                </ul>
            </div>
        </div>
        <?php
    }
    
    public function render_saved_cvs_page() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'gcb_saved_cvs';
        
        // Handle delete action
        if (isset($_GET['action']) && $_GET['action'] === 'delete' && isset($_GET['cv_id'])) {
            $cv_id = intval($_GET['cv_id']);
            if (wp_verify_nonce($_GET['_wpnonce'], 'delete_cv_' . $cv_id)) {
                $wpdb->delete($table_name, array('id' => $cv_id));
                echo '<div class="notice notice-success"><p>' . __('CV deleted successfully.', 'gemini-cv-builder') . '</p></div>';
            }
        }
        
        // Get saved CVs
        $saved_cvs = $wpdb->get_results("
            SELECT c.*, u.display_name, u.user_email 
            FROM $table_name c
            LEFT JOIN {$wpdb->users} u ON c.user_id = u.ID
            ORDER BY c.updated_at DESC
        ");
        
        ?>
        <div class="wrap">
            <h1><?php _e('Saved CVs', 'gemini-cv-builder'); ?></h1>
            
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php _e('ID', 'gemini-cv-builder'); ?></th>
                        <th><?php _e('User', 'gemini-cv-builder'); ?></th>
                        <th><?php _e('Created', 'gemini-cv-builder'); ?></th>
                        <th><?php _e('Updated', 'gemini-cv-builder'); ?></th>
                        <th><?php _e('Actions', 'gemini-cv-builder'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($saved_cvs)) : ?>
                        <tr>
                            <td colspan="5"><?php _e('No saved CVs found.', 'gemini-cv-builder'); ?></td>
                        </tr>
                    <?php else : ?>
                        <?php foreach ($saved_cvs as $cv) : ?>
                            <tr>
                                <td><?php echo esc_html($cv->id); ?></td>
                                <td>
                                    <?php echo esc_html($cv->display_name); ?><br>
                                    <small><?php echo esc_html($cv->user_email); ?></small>
                                </td>
                                <td><?php echo esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($cv->created_at))); ?></td>
                                <td><?php echo esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($cv->updated_at))); ?></td>
                                <td>
                                    <a href="#" class="button button-small gcb-view-cv" data-cv-id="<?php echo esc_attr($cv->id); ?>"><?php _e('View', 'gemini-cv-builder'); ?></a>
                                    <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=gcb-saved-cvs&action=delete&cv_id=' . $cv->id), 'delete_cv_' . $cv->id); ?>" class="button button-small button-link-delete" onclick="return confirm('<?php esc_attr_e('Are you sure you want to delete this CV?', 'gemini-cv-builder'); ?>');"><?php _e('Delete', 'gemini-cv-builder'); ?></a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
        
        <!-- Modal for viewing CV data -->
        <div id="gcb-cv-modal" style="display:none;">
            <div class="gcb-modal-content">
                <span class="gcb-close">&times;</span>
                <div id="gcb-cv-data"></div>
            </div>
        </div>
        <?php
    }
    
    public function render_api_section() {
        echo '<p>' . __('Configure your Gemini API settings below.', 'gemini-cv-builder') . '</p>';
    }
    
    public function render_general_section() {
        echo '<p>' . __('Configure general plugin settings.', 'gemini-cv-builder') . '</p>';
    }
    
    public function render_api_key_field() {
        $api_key = get_option('gcb_gemini_api_key', '');
        ?>
        <input type="password" name="gcb_gemini_api_key" id="gcb_gemini_api_key" value="<?php echo esc_attr($api_key); ?>" class="regular-text" />
        <button type="button" id="gcb-toggle-api-key" class="button button-secondary"><?php _e('Show', 'gemini-cv-builder'); ?></button>
        <p class="description"><?php _e('Enter your Gemini API key. You can get one from Google AI Studio.', 'gemini-cv-builder'); ?></p>
        <?php
    }
    
    public function render_enable_save_field() {
        $settings = get_option('gcb_settings', array());
        $enabled = isset($settings['enable_save_feature']) ? $settings['enable_save_feature'] : true;
        ?>
        <input type="checkbox" name="gcb_settings[enable_save_feature]" value="1" <?php checked($enabled, true); ?> />
        <p class="description"><?php _e('Allow users to save their CV data to the database.', 'gemini-cv-builder'); ?></p>
        <?php
    }
    
    public function render_allow_guest_field() {
        $settings = get_option('gcb_settings', array());
        $allowed = isset($settings['allow_guest_usage']) ? $settings['allow_guest_usage'] : true;
        ?>
        <input type="checkbox" name="gcb_settings[allow_guest_usage]" value="1" <?php checked($allowed, true); ?> />
        <p class="description"><?php _e('Allow non-logged-in users to use the CV builder.', 'gemini-cv-builder'); ?></p>
        <?php
    }
    
    public function render_rate_limit_field() {
        $settings = get_option('gcb_settings', array());
        $rate_limit = isset($settings['rate_limit']) ? $settings['rate_limit'] : 10;
        ?>
        <input type="number" name="gcb_settings[rate_limit]" value="<?php echo esc_attr($rate_limit); ?>" min="1" max="100" />
        <p class="description"><?php _e('Maximum number of Gemini API requests per user per hour.', 'gemini-cv-builder'); ?></p>
        <?php
    }
    
    public function sanitize_settings($input) {
        $sanitized = array();
        
        $sanitized['enable_save_feature'] = isset($input['enable_save_feature']) ? true : false;
        $sanitized['allow_guest_usage'] = isset($input['allow_guest_usage']) ? true : false;
        $sanitized['rate_limit'] = isset($input['rate_limit']) ? intval($input['rate_limit']) : 10;
        
        return $sanitized;
    }
    
    // Add this new method
    public function enqueue_admin_assets($hook) {
        // Only enqueue on our admin pages
        if (strpos($hook, 'gemini-cv-builder') === false && $hook !== 'toplevel_page_gemini-cv-builder' && $hook !== 'cv-builder_page_gcb-saved-cvs') {
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
        
        // Localize script with admin data
        wp_localize_script('gcb-admin-script', 'gcb_admin', array(
            'nonce' => wp_create_nonce('gcb_admin_nonce'),
            'ajax_url' => admin_url('admin-ajax.php'),
        ));
    }
}