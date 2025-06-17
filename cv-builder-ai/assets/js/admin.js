jQuery(document).ready(function($) {
    // Handle view CV button clicks
    $('.gcb-view-cv').on('click', function(e) {
        e.preventDefault();
        
        var cvId = $(this).data('cv-id');
        var $button = $(this);
        
        // Show loading state
        $button.text('Loading...');
        
        // AJAX request to get CV data
        $.post(ajaxurl, {
            action: 'gcb_admin_get_cv',
            cv_id: cvId,
            nonce: gcb_admin.nonce
        }, function(response) {
            if (response.success) {
                // Display CV data in modal
                $('#gcb-cv-data').html('<pre>' + JSON.stringify(response.data, null, 2) + '</pre>');
                $('#gcb-cv-modal').show();
            } else {
                alert('Error loading CV: ' + response.data.message);
            }
            
            $button.text('View');
        });
    });
    
    // Close modal
    $('.gcb-close, #gcb-cv-modal').on('click', function(e) {
        if (e.target === this) {
            $('#gcb-cv-modal').hide();
        }
    });
    
    // API key visibility toggle
    $('#gcb-toggle-api-key').on('click', function() {
        var $input = $('input[name="gcb_gemini_api_key"]');
        if ($input.attr('type') === 'password') {
            $input.attr('type', 'text');
            $(this).text('Hide');
        } else {
            $input.attr('type', 'password');
            $(this).text('Show');
        }
    });
});