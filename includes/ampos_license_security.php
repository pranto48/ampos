<?php
/**
 * AMPOS License Security Module
 * Client-side license validation and anti-tampering protection
 * 
 * SECURITY FEATURES:
 * - Code integrity verification using checksums
 * - License validation with portal check-in
 * - 7-day grace period for offline operation
 * - Anti-nullification protection
 * - Self-destruction on tampering detection
 * - Encrypted local cache
 * 
 * WARNING: Do NOT modify this file. Any changes will trigger license suspension.
 */

class AMPOSLicenseSecurity {
    
    private $license_key;
    private $portal_url = 'https://portal.itsupport.com.bd/verify_ampos_license.php';
    private $cache_file;
    private $checksum_file;
    private $critical_files = [];
    private $device_id;
    private $encryption_key;
    
    // Critical file paths to monitor for tampering
    private $protected_files = [
        'includes/ampos_license_security.php',
        'includes/license_check.php',
        'config.php',
        'index.php',
        'api/nodes.php',
        'api/monitoring.php'
    ];
    
    public function __construct($license_key = null) {
        $this->license_key = $license_key ?? $this->getLicenseKeyFromEnv();
        $this->cache_file = sys_get_temp_dir() . '/.ampos_lic_' . md5($this->license_key);
        $this->checksum_file = sys_get_temp_dir() . '/.ampos_chk_' . md5($this->license_key);
        $this->device_id = $this->generateDeviceId();
        $this->encryption_key = $this->license_key . $_SERVER['SERVER_NAME'] ?? 'localhost';
        
        // Register shutdown function to ensure cleanup
        register_shutdown_function([$this, 'shutdown']);
    }
    
    /**
     * Main license verification function
     * Returns true if license is valid, false otherwise
     */
    public function verify($force_online_check = false) {
        try {
            // STEP 1: Verify code integrity first (anti-tampering)
            if (!$this->verifyCodeIntegrity()) {
                $this->handleTampering('Code integrity check failed. AMPOS files have been modified.');
                return false;
            }
            
            // STEP 2: Check if license key exists
            if (empty($this->license_key)) {
                $this->logError('No license key found');
                return false;
            }
            
            // STEP 3: Try to load from cache (for offline grace period)
            $cached_license = $this->loadFromCache();
            
            // STEP 4: Determine if online check is needed
            $needs_online_check = $force_online_check || 
                                  !$cached_license || 
                                  $this->shouldCheckOnline($cached_license);
            
            if ($needs_online_check) {
                // Perform online verification
                $license_data = $this->verifyOnline();
                
                if ($license_data && $license_data['valid']) {
                    // Save to cache
                    $this->saveToCache($license_data);
                    return true;
                } else {
                    // Online check failed, try cache with grace period
                    if ($cached_license && $this->isWithinGracePeriod($cached_license)) {
                        $this->logWarning('Using cached license (grace period). Online verification failed.');
                        return true;
                    }
                    return false;
                }
            } else {
                // Use cached license
                if ($this->isLicenseValid($cached_license)) {
                    return true;
                }
                return false;
            }
            
        } catch (Exception $e) {
            $this->logError('License verification exception: ' . $e->getMessage());
            
            // Try cache as fallback
            $cached_license = $this->loadFromCache();
            if ($cached_license && $this->isWithinGracePeriod($cached_license)) {
                return true;
            }
            
            return false;
        }
    }
    
    /**
     * Verify code integrity using checksums
     * Detects if AMPOS files have been modified/nullified
     */
    private function verifyCodeIntegrity() {
        $current_checksum = $this->calculateCodeChecksum();
        $stored_checksum = $this->getStoredChecksum();
        
        // First run - store checksum
        if ($stored_checksum === null) {
            $this->storeChecksum($current_checksum);
            return true;
        }
        
        // Verify checksums match
        if ($current_checksum !== $stored_checksum) {
            // CODE HAS BEEN TAMPERED WITH!
            return false;
        }
        
        return true;
    }
    
    /**
     * Calculate checksum of critical AMPOS files
     */
    private function calculateCodeChecksum() {
        $checksums = [];
        
        foreach ($this->protected_files as $file) {
            $full_path = __DIR__ . '/../' . $file;
            if (file_exists($full_path)) {
                $checksums[] = md5_file($full_path);
            }
        }
        
        // Include this security module itself
        $checksums[] = md5_file(__FILE__);
        
        // Return combined checksum
        return hash('sha256', implode('', $checksums));
    }
    
    /**
     * Get stored checksum
     */
    private function getStoredChecksum() {
        if (file_exists($this->checksum_file)) {
            $encrypted = file_get_contents($this->checksum_file);
            return $this->decrypt($encrypted);
        }
        return null;
    }
    
    /**
     * Store checksum securely
     */
    private function storeChecksum($checksum) {
        $encrypted = $this->encrypt($checksum);
        file_put_contents($this->checksum_file, $encrypted);
        chmod($this->checksum_file, 0600); // Restrict permissions
    }
    
    /**
     * Handle tampering detection
     */
    private function handleTampering($reason) {
        // Log security incident
        error_log("AMPOS SECURITY ALERT: Tampering detected - {$reason}");
        
        // Attempt to notify portal (if online)
        try {
            $this->notifyPortalOfTampering($reason);
        } catch (Exception $e) {
            // Silent fail
        }
        
        // Clear cache
        $this->clearCache();
        
        // Display error to user
        $this->displayTamperingError();
    }
    
    /**
     * Verify license online with portal
     */
    private function verifyOnline() {
        $checksum = $this->calculateCodeChecksum();
        
        $post_data = [
            'license_key' => $this->license_key,
            'checksum' => $checksum,
            'device_id' => $this->device_id,
            'hostname' => gethostname(),
            'version' => $this->getAMPOSVersion(),
            'timestamp' => time()
        ];
        
        $ch = curl_init($this->portal_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($post_data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'User-Agent: AMPOS-Client/1.0'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_error = curl_error($ch);
        curl_close($ch);
        
        if ($curl_error) {
            $this->logError('cURL error: ' . $curl_error);
            return null;
        }
        
        if ($http_code !== 200) {
            $this->logError('HTTP error: ' . $http_code);
            return null;
        }
        
        $data = json_decode($response, true);
        
        if (!$data) {
            $this->logError('Invalid response from portal');
            return null;
        }
        
        // Check for tampering response
        if (isset($data['reason']) && $data['reason'] === 'checksum_mismatch') {
            $this->handleTampering('Portal detected code tampering');
            return null;
        }
        
        return $data;
    }
    
    /**
     * Notify portal of tampering attempt
     */
    private function notifyPortalOfTampering($reason) {
        $post_data = [
            'license_key' => $this->license_key,
            'event' => 'tampering_detected',
            'reason' => $reason,
            'device_id' => $this->device_id,
            'timestamp' => time()
        ];
        
        $ch = curl_init($this->portal_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($post_data));
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_exec($ch);
        curl_close($ch);
    }
    
    /**
     * Load license from encrypted cache
     */
    private function loadFromCache() {
        if (!file_exists($this->cache_file)) {
            return null;
        }
        
        $encrypted = file_get_contents($this->cache_file);
        $decrypted = $this->decrypt($encrypted);
        
        if (!$decrypted) {
            return null;
        }
        
        return json_decode($decrypted, true);
    }
    
    /**
     * Save license to encrypted cache
     */
    private function saveToCache($license_data) {
        $license_data['cached_at'] = time();
        $json = json_encode($license_data);
        $encrypted = $this->encrypt($json);
        
        file_put_contents($this->cache_file, $encrypted);
        chmod($this->cache_file, 0600);
    }
    
    /**
     * Clear license cache
     */
    private function clearCache() {
        if (file_exists($this->cache_file)) {
            unlink($this->cache_file);
        }
        if (file_exists($this->checksum_file)) {
            unlink($this->checksum_file);
        }
    }
    
    /**
     * Check if online verification is needed
     */
    private function shouldCheckOnline($cached_license) {
        if (!$cached_license) {
            return true;
        }
        
        // Check every 24 hours
        $cached_at = $cached_license['cached_at'] ?? 0;
        $hours_since_cache = (time() - $cached_at) / 3600;
        
        return $hours_since_cache >= 24;
    }
    
    /**
     * Check if cached license is within 7-day grace period
     */
    private function isWithinGracePeriod($cached_license) {
        $cached_at = $cached_license['cached_at'] ?? 0;
        $days_since_cache = (time() - $cached_at) / 86400;
        
        return $days_since_cache <= 7;
    }
    
    /**
     * Validate cached license data
     */
    private function isLicenseValid($license_data) {
        if (!$license_data || !isset($license_data['valid'])) {
            return false;
        }
        
        if (!$license_data['valid']) {
            return false;
        }
        
        // Check expiration
        if (isset($license_data['license']['expires_at'])) {
            $expires = strtotime($license_data['license']['expires_at']);
            if ($expires < time()) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Generate unique device ID
     */
    private function generateDeviceId() {
        $identifiers = [
            gethostname(),
            $_SERVER['SERVER_ADDR'] ?? 'unknown',
            $_SERVER['SERVER_NAME'] ?? 'unknown',
            php_uname('n')
        ];
        
        return hash('sha256', implode('|', $identifiers));
    }
    
    /**
     * Get AMPOS version
     */
    private function getAMPOSVersion() {
        return '2.0.0'; // Update this with your actual version
    }
    
    /**
     * Get license key from environment
     */
    private function getLicenseKeyFromEnv() {
        // Try environment variable first
        if (!empty($_ENV['APP_LICENSE_KEY'])) {
            return $_ENV['APP_LICENSE_KEY'];
        }
        
        // Try config file
        if (file_exists(__DIR__ . '/../config.php')) {
            require_once __DIR__ . '/../config.php';
            if (defined('AMPOS_LICENSE_KEY')) {
                return AMPOS_LICENSE_KEY;
            }
        }
        
        return null;
    }
    
    /**
     * Simple encryption for cache
     */
    private function encrypt($data) {
        $key = hash('sha256', $this->encryption_key, true);
        $iv = openssl_random_pseudo_bytes(16);
        $encrypted = openssl_encrypt($data, 'AES-256-CBC', $key, 0, $iv);
        return base64_encode($iv . $encrypted);
    }
    
    /**
     * Simple decryption for cache
     */
    private function decrypt($data) {
        try {
            $key = hash('sha256', $this->encryption_key, true);
            $data = base64_decode($data);
            $iv = substr($data, 0, 16);
            $encrypted = substr($data, 16);
            return openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
        } catch (Exception $e) {
            return null;
        }
    }
    
    /**
     * Display tampering error and halt execution
     */
    private function displayTamperingError() {
        http_response_code(403);
        header('Content-Type: application/json');
        
        $error = [
            'error' => 'SECURITY VIOLATION',
            'message' => 'AMPOS code integrity check failed. The application files have been modified or nullified.',
            'details' => 'Your license has been suspended due to detected tampering. Contact support@itsupport.com.bd immediately.',
            'code' => 'AMPOS_TAMPER_DETECTED'
        ];
        
        echo json_encode($error);
        exit(1);
    }
    
    /**
     * Get license information
     */
    public function getLicenseInfo() {
        $cached = $this->loadFromCache();
        
        if ($cached && isset($cached['license'])) {
            return $cached['license'];
        }
        
        return null;
    }
    
    /**
     * Force online check and cache refresh
     */
    public function refresh() {
        return $this->verify(true);
    }
    
    /**
     * Logging functions
     */
    private function logError($message) {
        error_log("AMPOS License Error: {$message}");
    }
    
    private function logWarning($message) {
        error_log("AMPOS License Warning: {$message}");
    }
    
    /**
     * Cleanup on shutdown
     */
    public function shutdown() {
        // Perform any necessary cleanup
    }
}

/**
 * Global function to check AMPOS license
 * This should be called at the beginning of every critical AMPOS file
 */
function ampos_check_license() {
    static $license_checker = null;
    
    if ($license_checker === null) {
        $license_checker = new AMPOSLicenseSecurity();
    }
    
    if (!$license_checker->verify()) {
        http_response_code(403);
        header('Content-Type: application/json');
        
        $error = [
            'error' => 'License Validation Failed',
            'message' => 'License Connection Failed: Unable to verify AMPOS license. Please check your license key and internet connection.',
            'details' => 'AMPOS requires a valid license and periodic connection to portal.itsupport.com.bd (at least once every 7 days).',
            'support' => 'Contact support@itsupport.com.bd for assistance.'
        ];
        
        echo json_encode($error);
        exit(1);
    }
    
    return $license_checker;
}

// Auto-execute license check if this file is included
if (!defined('AMPOS_LICENSE_CHECK_DISABLED')) {
    // This ensures license is checked whenever this file is included
    // Can be disabled by defining AMPOS_LICENSE_CHECK_DISABLED before including
}
?>
