// Jazzmin RTL/LTR Auto-detection based on Django language
(function() {
    'use strict';
    
    // Get language from Django's LANGUAGE_CODE or HTML lang attribute
    function getLanguage() {
        // Try to get from HTML lang attribute
        const htmlLang = document.documentElement.getAttribute('lang');
        if (htmlLang) {
            return htmlLang.split('-')[0]; // Get 'ar' from 'ar-SA'
        }
        
        // Try to get from body data attribute
        const bodyLang = document.body.getAttribute('data-language');
        if (bodyLang) {
            return bodyLang;
        }
        
        // Try to get from Django's LANGUAGE_CODE (if available in template)
        const djangoLang = window.django && window.django.languageCode;
        if (djangoLang) {
            return djangoLang;
        }
        
        // Default to Arabic if RTL is detected, otherwise English
        const isRTL = window.getComputedStyle(document.documentElement).direction === 'rtl';
        return isRTL ? 'ar' : 'en';
    }
    
    // Apply RTL/LTR based on language
    function applyDirection() {
        const lang = getLanguage();
        const html = document.documentElement;
        
        if (lang === 'ar' || lang.startsWith('ar')) {
            html.setAttribute('dir', 'rtl');
            html.setAttribute('lang', 'ar');
            document.body.setAttribute('data-language', 'ar');
        } else {
            html.setAttribute('dir', 'ltr');
            html.setAttribute('lang', 'en');
            document.body.setAttribute('data-language', 'en');
        }
    }
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyDirection);
    } else {
        applyDirection();
    }
    
    // Also run immediately in case DOM is already loaded
    applyDirection();
})();

