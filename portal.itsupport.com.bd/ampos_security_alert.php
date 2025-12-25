<?php
/**
 * AMPOS Security Alert Handler
 * =============================
 * Receives and processes security alerts from AMPOS instances
 * - Tampering detection notifications
 * - Automatic license suspension
 * - Admin email notifications
 * - Security incident logging
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once 'config.php';

try {
    $pdo = getLicenseDbConnection();
    
    // Get request data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('Invalid request data');
    }
    
    $license_key = $data['license_key'] ?? '';
    $event = $data['event'] ?? 'unknown';
    $reason = $data['reason'] ?? '';
    $device_id = $data['device_id'] ?? '';
    $hostname = $data['hostname'] ?? '';
    $timestamp = $data['timestamp'] ?? time();
    $ip_address = $data['ip_address'] ?? $_SERVER['REMOTE_ADDR'];
    
    // Log security incident
    error_log("AMPOS SECURITY ALERT: {$event} - {$reason} - License: {$license_key} - IP: {$ip_address}");
    
    // Find the license
    $stmt = $pdo->prepare("
        SELECT l.*, c.email, c.first_name, c.last_name, p.name as product_name
        FROM `licenses` l
        JOIN `customers` c ON l.customer_id = c.id
        JOIN `products` p ON l.product_id = p.id
        WHERE l.license_key = ?
    ");
    $stmt->execute([$license_key]);
    $license = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$license) {
        // Log attempt with unknown license
        error_log("AMPOS SECURITY: Alert received for unknown license: {$license_key}");
        echo json_encode(['success' => false, 'error' => 'License not found']);
        exit;
    }
    
    // Insert security incident record
    $stmt = $pdo->prepare("
        INSERT INTO `ampos_security_incidents` 
        (license_id, event_type, reason, device_id, hostname, ip_address, incident_data, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?))
    ");
    $stmt->execute([
        $license['id'],
        $event,
        $reason,
        $device_id,
        $hostname,
        $ip_address,
        json_encode($data),
        $timestamp
    ]);
    
    $incident_id = $pdo->lastInsertId();
    
    // Handle tampering events - automatically suspend license
    if ($event === 'tampering_detected') {
        // Suspend the license immediately
        $stmt = $pdo->prepare("
            UPDATE `licenses` 
            SET status = 'suspended', 
                updated_at = CURRENT_TIMESTAMP,
                suspension_reason = ?
            WHERE id = ?
        ");
        $stmt->execute(["Security violation: {$reason}", $license['id']]);
        
        // Send email notification to customer
        $customer_email_subject = "URGENT: AMPOS License Suspended - Security Violation";
        $customer_email_body = "
        <h2 style='color: #ef4444;'>Security Alert: License Suspended</h2>
        <p>Dear {$license['first_name']} {$license['last_name']},</p>
        
        <p><strong>Your AMPOS license has been automatically suspended due to a security violation.</strong></p>
        
        <div style='background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;'>
            <p><strong>License Key:</strong> {$license_key}</p>
            <p><strong>Event:</strong> {$event}</p>
            <p><strong>Reason:</strong> {$reason}</p>
            <p><strong>Device:</strong> {$hostname} ({$device_id})</p>
            <p><strong>Detection Time:</strong> " . date('Y-m-d H:i:s', $timestamp) . "</p>
        </div>
        
        <h3>What This Means:</h3>
        <p>Our security system detected unauthorized modification or tampering with your AMPOS installation. This could indicate:</p>
        <ul>
            <li>Code files have been modified</li>
            <li>License files have been tampered with</li>
            <li>Unauthorized cracking attempts</li>
            <li>System integrity compromised</li>
        </ul>
        
        <h3>Immediate Actions Required:</h3>
        <ol>
            <li><strong>Stop using the affected system</strong> - The installation has been locked</li>
            <li><strong>Do not attempt to bypass</strong> - This will result in permanent license revocation</li>
            <li><strong>Contact support immediately</strong> - We will investigate and assist with resolution</li>
        </ol>
        
        <div style='background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;'>
            <h4>Contact Support:</h4>
            <p><strong>Email:</strong> support@itsupport.com.bd</p>
            <p><strong>Portal:</strong> <a href='https://portal.itsupport.com.bd'>portal.itsupport.com.bd</a></p>
            <p><strong>Incident ID:</strong> #{$incident_id}</p>
        </div>
        
        <p><strong>Note:</strong> If this was triggered in error, please contact us immediately with your incident ID.</p>
        
        <p>Best regards,<br>IT Support BD Security Team</p>
        ";
        
        // Send email to customer (implement your email function)
        @send_portal_email($license['email'], $customer_email_subject, $customer_email_body);
        
        // Send email notification to admin
        $admin_email = 'admin@itsupport.com.bd'; // Configure this
        $admin_subject = "CRITICAL: AMPOS Security Violation - License {$license_key}";
        $admin_body = "
        <h2 style='color: #ef4444;'>CRITICAL SECURITY ALERT</h2>
        <p><strong>AMPOS tampering detected and license automatically suspended.</strong></p>
        
        <h3>Incident Details:</h3>
        <table style='border-collapse: collapse; width: 100%;'>
            <tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>Incident ID:</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>#{$incident_id}</td></tr>
            <tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>License Key:</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>{$license_key}</td></tr>
            <tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>Customer:</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>{$license['first_name']} {$license['last_name']} ({$license['email']})</td></tr>
            <tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>Product:</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>{$license['product_name']}</td></tr>
            <tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>Event:</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>{$event}</td></tr>
            <tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>Reason:</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>{$reason}</td></tr>
            <tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>Device ID:</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>{$device_id}</td></tr>
            <tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>Hostname:</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>{$hostname}</td></tr>
            <tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>IP Address:</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>{$ip_address}</td></tr>
            <tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>Timestamp:</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>" . date('Y-m-d H:i:s', $timestamp) . "</td></tr>
        </table>
        
        <h3>Automated Actions Taken:</h3>
        <ul>
            <li>✅ License suspended</li>
            <li>✅ Security incident logged</li>
            <li>✅ Customer notified</li>
            <li>✅ System access blocked</li>
        </ul>
        
        <p><strong>Action Required:</strong> Review incident and contact customer if necessary.</p>
        
        <p><a href='https://portal.itsupport.com.bd/admin/security-incidents.php?id={$incident_id}' style='display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;'>View Incident Details</a></p>
        ";
        
        @send_portal_email($admin_email, $admin_subject, $admin_body);
        
        echo json_encode([
            'success' => true,
            'message' => 'Security incident recorded and license suspended',
            'incident_id' => $incident_id,
            'license_suspended' => true
        ]);
    } else {
        // Other security events - just log
        echo json_encode([
            'success' => true,
            'message' => 'Security incident recorded',
            'incident_id' => $incident_id
        ]);
    }
    
} catch (Exception $e) {
    error_log("AMPOS Security Alert Handler Error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to process security alert',
        'message' => $e->getMessage()
    ]);
}
