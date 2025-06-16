<?php
/**
 * The plugin bootstrap file
 *
 * This file is read by WordPress to generate the plugin information in the plugin
 * admin area. This file also includes all of the dependencies used by the plugin,
 * registers the activation and deactivation functions, and defines a function
 * that starts the plugin.
 *
 * @link              https://yourwebsite.com
 * @since             1.0.0
 * @package           Ai_Cv_Builder
 *
 * @wordpress-plugin
 * Plugin Name:       AI CV Builder
 * Plugin URI:        https://yourwebsite.com/ai-cv-builder
 * Description:       A plugin to build CVs with the help of AI (Gemini API).
 * Version:           1.0.0
 * Author:            Your Name or Company
 * Author URI:        https://yourwebsite.com
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       ai-cv-builder
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
    die;
}

define( 'AI_CV_BUILDER_VERSION', '1.0.0' );
define( 'AI_CV_BUILDER_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'AI_CV_BUILDER_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * The code that runs during plugin activation.
 * This action is documented in includes/class-ai-cv-builder-activator.php
 */
function activate_ai_cv_builder() {
    require_once AI_CV_BUILDER_PLUGIN_DIR . 'includes/class-ai-cv-builder-activator.php';
    Ai_Cv_Builder_Activator::activate();
}

/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/class-ai-cv-builder-deactivator.php
 */
function deactivate_ai_cv_builder() {
    require_once AI_CV_BUILDER_PLUGIN_DIR . 'includes/class-ai-cv-builder-deactivator.php';
    Ai_Cv_Builder_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_ai_cv_builder' );
register_deactivation_hook( __FILE__, 'deactivate_ai_cv_builder' );

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require AI_CV_BUILDER_PLUGIN_DIR . 'includes/class-ai-cv-builder.php';

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */
function run_ai_cv_builder() {

    $plugin = new Ai_Cv_Builder();
    $plugin->run();

}
run_ai_cv_builder();
