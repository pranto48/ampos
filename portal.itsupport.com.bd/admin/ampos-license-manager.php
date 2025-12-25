<?php
require_once '../includes/functions.php';

// Ensure admin is logged in
if (!isAdminLoggedIn()) {
    redirectToAdminLogin();
}

$pdo = getLicenseDbConnection();
$message = '';

// Function to generate AMPOS-prefixed license key
function generateAmposLicenseKey() {
    $segments = [];
    for ($i = 0; $i < 4; $i++) {
        $segments[] = strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));
    }
    return 'AMPOS-' . implode('-', $segments);
}

// Handle generate license action
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['generate_license'])) {
    $customer_id = (int)$_POST['customer_id'];
    $product_id = (int)$_POST['product_id'];
    $status = $_POST['status'] ?? 'active';

    try {
        // Verify product is AMPOS category
        $stmt = $pdo->prepare("SELECT max_devices, license_duration_days, category FROM `products` WHERE id = ?");
        $stmt->execute([$product_id]);
        $product_details = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$product_details) {
            throw new Exception("Product not found.");
        }

        if ($product_details['category'] !== 'AMPOS') {
            throw new Exception("Selected product is not an AMPOS product.");
        }

        $max_devices = $product_details['max_devices'];
        $license_duration_days = $product_details['license_duration_days'];
        $expires_at = date('Y-m-d H:i:s', strtotime("+$license_duration_days days"));

        $license_key = generateAmposLicenseKey();
        
        $stmt = $pdo->prepare("INSERT INTO `licenses` (customer_id, product_id, license_key, status, max_devices, expires_at, last_active_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$customer_id, $product_id, $license_key, $status, $max_devices, $expires_at]);
        $message = '<div class="alert-admin-success mb-4">AMPOS License generated: <span class="font-mono font-bold">' . htmlspecialchars($license_key) . '</span></div>';
    } catch (Exception $e) {
        $message = '<div class="alert-admin-error mb-4">Error: ' . htmlspecialchars($e->getMessage()) . '</div>';
    }
}

// Handle update license status/expiry/max_devices
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_license'])) {
    $license_id = (int)$_POST['license_id'];
    $new_status = $_POST['new_status'] ?? 'active';
    $new_expires_at = $_POST['new_expires_at'] ?? null;
    $new_max_devices = (int)$_POST['new_max_devices'];

    try {
        $sql = "UPDATE `licenses` SET status = ?, expires_at = ?, max_devices = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$new_status, $new_expires_at, $new_max_devices, $license_id]);
        $message = '<div class="alert-admin-success mb-4">AMPOS License updated successfully.</div>';
    } catch (PDOException $e) {
        $message = '<div class="alert-admin-error mb-4">Error updating license: ' . htmlspecialchars($e->getMessage()) . '</div>';
    }
}

// Handle release license action
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['release_license'])) {
    $license_id = (int)$_POST['license_id'];
    try {
        $stmt = $pdo->prepare("UPDATE `licenses` SET bound_installation_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$license_id]);
        $message = '<div class="alert-admin-success mb-4">License released. It can now be used on a new installation.</div>';
    } catch (PDOException $e) {
        $message = '<div class="alert-admin-error mb-4">Error releasing license: ' . htmlspecialchars($e->getMessage()) . '</div>';
    }
}

// Handle delete license action
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_license'])) {
    $license_id = (int)$_POST['license_id'];
    try {
        $stmt = $pdo->prepare("DELETE FROM `licenses` WHERE id = ?");
        $stmt->execute([$license_id]);
        $message = '<div class="alert-admin-success mb-4">AMPOS License deleted.</div>';
    } catch (PDOException $e) {
        $message = '<div class="alert-admin-error mb-4">Error deleting license: ' . htmlspecialchars($e->getMessage()) . '</div>';
    }
}

// Fetch all customers for dropdown
$stmt_customers = $pdo->query("SELECT id, email FROM `customers` ORDER BY email ASC");
$customers = $stmt_customers->fetchAll(PDO::FETCH_ASSOC);

// Fetch AMPOS products only for dropdown
$stmt_products = $pdo->query("SELECT id, name, price FROM `products` WHERE category = 'AMPOS' ORDER BY price ASC");
$ampos_products = $stmt_products->fetchAll(PDO::FETCH_ASSOC);

// Fetch AMPOS licenses with joins
$stmt_licenses = $pdo->query("
    SELECT 
        l.*, 
        c.email as customer_email,
        p.name as product_name,
        p.category as product_category,
        (SELECT COUNT(*) FROM licenses WHERE license_key = l.license_key) as current_devices
    FROM `licenses` l
    LEFT JOIN `customers` c ON l.customer_id = c.id
    LEFT JOIN `products` p ON l.product_id = p.id
    WHERE p.category = 'AMPOS' OR l.license_key LIKE 'AMPOS-%'
    ORDER BY l.created_at DESC
");
$licenses = $stmt_licenses->fetchAll(PDO::FETCH_ASSOC);

// License tier stats
$tier_stats = [];
foreach ($ampos_products as $prod) {
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM licenses l JOIN products p ON l.product_id = p.id WHERE p.id = ?");
    $stmt->execute([$prod['id']]);
    $tier_stats[$prod['name']] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
}

admin_header("AMPOS License Manager");
?>

<div class="flex items-center justify-between mb-8">
    <h1 class="text-4xl font-bold text-cyan-400">
        <i class="fas fa-cash-register mr-3"></i>AMPOS License Manager
    </h1>
    <a href="license-manager.php" class="btn-admin-secondary">
        <i class="fas fa-arrow-left mr-2"></i>Back to All Licenses
    </a>
</div>

<?= $message ?>

<!-- Stats Cards -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
    <?php foreach ($ampos_products as $prod): ?>
    <div class="admin-card p-4 border-l-4 <?= $prod['price'] == 0 ? 'border-green-500' : ($prod['price'] <= 5 ? 'border-blue-500' : ($prod['price'] <= 10 ? 'border-purple-500' : 'border-yellow-500')) ?>">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-400 text-sm"><?= htmlspecialchars($prod['name']) ?></p>
                <p class="text-2xl font-bold text-white"><?= $tier_stats[$prod['name']] ?? 0 ?></p>
            </div>
            <div class="text-3xl <?= $prod['price'] == 0 ? 'text-green-500' : ($prod['price'] <= 5 ? 'text-blue-500' : ($prod['price'] <= 10 ? 'text-purple-500' : 'text-yellow-500')) ?>">
                <?php if ($prod['price'] == 0): ?>
                    <i class="fas fa-gift"></i>
                <?php elseif ($prod['price'] <= 5): ?>
                    <i class="fas fa-star"></i>
                <?php elseif ($prod['price'] <= 10): ?>
                    <i class="fas fa-gem"></i>
                <?php else: ?>
                    <i class="fas fa-crown"></i>
                <?php endif; ?>
            </div>
        </div>
        <p class="text-xs text-gray-500 mt-1">$<?= number_format($prod['price'], 2) ?></p>
    </div>
    <?php endforeach; ?>
</div>

<!-- Generate New License -->
<div class="admin-card mb-8 p-6 border-t-4 border-cyan-500">
    <h2 class="text-2xl font-semibold text-cyan-400 mb-4">
        <i class="fas fa-plus-circle mr-2"></i>Generate New AMPOS License
    </h2>
    <form action="ampos-license-manager.php" method="POST" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
            <label for="customer_id" class="block text-gray-300 text-sm font-bold mb-2">Customer:</label>
            <select id="customer_id" name="customer_id" class="form-admin-input" required>
                <option value="">-- Select Customer --</option>
                <?php foreach ($customers as $customer): ?>
                    <option value="<?= htmlspecialchars($customer['id']) ?>"><?= htmlspecialchars($customer['email']) ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div>
            <label for="product_id" class="block text-gray-300 text-sm font-bold mb-2">License Tier:</label>
            <select id="product_id" name="product_id" class="form-admin-input" required>
                <option value="">-- Select Tier --</option>
                <?php foreach ($ampos_products as $product): ?>
                    <option value="<?= htmlspecialchars($product['id']) ?>">
                        <?= htmlspecialchars($product['name']) ?> ($<?= number_format($product['price'], 2) ?>)
                    </option>
                <?php endforeach; ?>
            </select>
        </div>
        <div>
            <label for="status" class="block text-gray-300 text-sm font-bold mb-2">Status:</label>
            <select id="status" name="status" class="form-admin-input">
                <option value="active">Active</option>
                <option value="free">Free</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
            </select>
        </div>
        <div class="flex items-end">
            <button type="submit" name="generate_license" class="btn-admin-primary w-full">
                <i class="fas fa-key mr-2"></i>Generate AMPOS Key
            </button>
        </div>
    </form>
    <p class="text-gray-500 text-xs mt-3">
        <i class="fas fa-info-circle mr-1"></i>
        Generated keys will have the format: <span class="font-mono">AMPOS-XXXXX-XXXXX-XXXXX-XXXXX</span>
    </p>
</div>

<!-- Filters -->
<div class="admin-card p-4 mb-4">
    <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
            <label class="text-gray-400 text-sm">Filter by Tier:</label>
            <select id="tierFilter" class="form-admin-input py-1 px-3 text-sm" style="width: auto;">
                <option value="all">All Tiers</option>
                <?php foreach ($ampos_products as $product): ?>
                    <option value="<?= htmlspecialchars($product['name']) ?>"><?= htmlspecialchars($product['name']) ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="flex items-center gap-2">
            <label class="text-gray-400 text-sm">Status:</label>
            <select id="statusFilter" class="form-admin-input py-1 px-3 text-sm" style="width: auto;">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="free">Free</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
            </select>
        </div>
        <div class="flex-grow">
            <input type="text" id="searchInput" placeholder="Search by license key or customer email..." class="form-admin-input py-1 px-3 text-sm w-full">
        </div>
        <button id="clearFiltersBtn" class="btn-admin-secondary text-xs px-3 py-1">
            <i class="fas fa-times mr-1"></i>Clear
        </button>
    </div>
</div>

<!-- Licenses Table -->
<div class="admin-card p-6">
    <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-semibold text-cyan-400">
            <i class="fas fa-list mr-2"></i>AMPOS Licenses
            <span id="licenseCount" class="text-sm font-normal text-gray-400 ml-2">(<?= count($licenses) ?> total)</span>
        </h2>
        <button id="refreshBtn" class="btn-admin-primary text-xs px-3 py-1">
            <i class="fas fa-sync-alt mr-1"></i>Refresh
        </button>
    </div>
    
    <div class="overflow-x-auto">
        <table class="min-w-full bg-gray-700 rounded-lg" id="licensesTable">
            <thead>
                <tr class="bg-gray-600 text-gray-200 uppercase text-xs leading-normal">
                    <th class="py-3 px-4 text-left">License Key</th>
                    <th class="py-3 px-4 text-left">Customer</th>
                    <th class="py-3 px-4 text-left">Tier</th>
                    <th class="py-3 px-4 text-left">Status</th>
                    <th class="py-3 px-4 text-left">Max Devices</th>
                    <th class="py-3 px-4 text-left">Bound To</th>
                    <th class="py-3 px-4 text-left">Last Active</th>
                    <th class="py-3 px-4 text-left">Expires</th>
                    <th class="py-3 px-4 text-center">Actions</th>
                </tr>
            </thead>
            <tbody class="text-gray-300 text-sm">
                <?php if (empty($licenses)): ?>
                    <tr><td colspan="9" class="text-center py-8 text-gray-500">No AMPOS licenses found. Generate your first one above.</td></tr>
                <?php else: ?>
                    <?php foreach ($licenses as $license): ?>
                        <tr class="border-b border-gray-600 hover:bg-gray-600 license-row"
                            data-tier="<?= htmlspecialchars($license['product_name'] ?? '') ?>"
                            data-status="<?= htmlspecialchars($license['status']) ?>"
                            data-search="<?= htmlspecialchars(strtolower($license['license_key'] . ' ' . ($license['customer_email'] ?? ''))) ?>">
                            <td class="py-3 px-4 font-mono text-xs text-cyan-300"><?= htmlspecialchars($license['license_key']) ?></td>
                            <td class="py-3 px-4"><?= htmlspecialchars($license['customer_email'] ?? 'N/A') ?></td>
                            <td class="py-3 px-4">
                                <span class="py-1 px-2 rounded text-xs 
                                    <?php
                                        $tier = $license['product_name'] ?? '';
                                        if (strpos($tier, 'Basic') !== false) echo 'bg-green-600';
                                        elseif (strpos($tier, 'Standard') !== false) echo 'bg-blue-600';
                                        elseif (strpos($tier, 'Advanced') !== false) echo 'bg-purple-600';
                                        elseif (strpos($tier, 'Enterprise') !== false) echo 'bg-yellow-600';
                                        else echo 'bg-gray-600';
                                    ?>">
                                    <?= htmlspecialchars($license['product_name'] ?? 'Unknown') ?>
                                </span>
                            </td>
                            <td class="py-3 px-4">
                                <span class="py-1 px-2 rounded-full text-xs 
                                    <?= $license['status'] == 'active' ? 'bg-green-500' : 
                                        ($license['status'] == 'free' ? 'bg-blue-500' : 
                                        ($license['status'] == 'expired' ? 'bg-red-500' : 'bg-yellow-500')) ?>">
                                    <?= ucfirst($license['status']) ?>
                                </span>
                            </td>
                            <td class="py-3 px-4"><?= htmlspecialchars($license['max_devices']) ?></td>
                            <td class="py-3 px-4">
                                <?php if ($license['bound_installation_id']): ?>
                                    <span class="text-xs text-orange-400" title="<?= htmlspecialchars($license['bound_installation_id']) ?>">
                                        <i class="fas fa-lock mr-1"></i><?= substr($license['bound_installation_id'], 0, 12) ?>...
                                    </span>
                                <?php else: ?>
                                    <span class="text-gray-500 text-xs"><i class="fas fa-unlock mr-1"></i>Unbound</span>
                                <?php endif; ?>
                            </td>
                            <td class="py-3 px-4 text-xs"><?= $license['last_active_at'] ? date('M j, Y H:i', strtotime($license['last_active_at'])) : 'Never' ?></td>
                            <td class="py-3 px-4 text-xs"><?= $license['expires_at'] ? date('M j, Y', strtotime($license['expires_at'])) : 'Never' ?></td>
                            <td class="py-3 px-4 text-center whitespace-nowrap">
                                <button onclick="openEditModal(<?= htmlspecialchars(json_encode($license)) ?>)" class="btn-admin-primary text-xs px-2 py-1">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <?php if ($license['bound_installation_id']): ?>
                                    <form action="ampos-license-manager.php" method="POST" class="inline-block" onsubmit="return confirm('Release this license from its current installation?');">
                                        <input type="hidden" name="license_id" value="<?= $license['id'] ?>">
                                        <button type="submit" name="release_license" class="btn-admin-secondary text-xs px-2 py-1" title="Release">
                                            <i class="fas fa-unlink"></i>
                                        </button>
                                    </form>
                                <?php endif; ?>
                                <form action="ampos-license-manager.php" method="POST" class="inline-block" onsubmit="return confirm('Delete this AMPOS license permanently?');">
                                    <input type="hidden" name="license_id" value="<?= $license['id'] ?>">
                                    <button type="submit" name="delete_license" class="btn-admin-danger text-xs px-2 py-1">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </form>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Edit License Modal -->
<div id="editLicenseModal" class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center hidden z-50">
    <div class="bg-gray-700 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 class="text-2xl font-semibold text-cyan-400 mb-4">
            <i class="fas fa-edit mr-2"></i>Edit AMPOS License
        </h2>
        <form action="ampos-license-manager.php" method="POST" class="space-y-4">
            <input type="hidden" name="license_id" id="edit_license_id">
            <div>
                <label class="block text-gray-300 text-sm font-bold mb-2">License Key:</label>
                <input type="text" id="edit_license_key" class="form-admin-input font-mono text-cyan-300" readonly>
            </div>
            <div>
                <label class="block text-gray-300 text-sm font-bold mb-2">Customer:</label>
                <input type="text" id="edit_customer_email" class="form-admin-input" readonly>
            </div>
            <div>
                <label class="block text-gray-300 text-sm font-bold mb-2">Tier:</label>
                <input type="text" id="edit_product_name" class="form-admin-input" readonly>
            </div>
            <div>
                <label for="new_status" class="block text-gray-300 text-sm font-bold mb-2">Status:</label>
                <select id="new_status" name="new_status" class="form-admin-input">
                    <option value="active">Active</option>
                    <option value="free">Free</option>
                    <option value="expired">Expired</option>
                    <option value="revoked">Revoked</option>
                </select>
            </div>
            <div>
                <label for="new_max_devices" class="block text-gray-300 text-sm font-bold mb-2">Max Devices:</label>
                <input type="number" id="new_max_devices" name="new_max_devices" class="form-admin-input" min="1" required>
            </div>
            <div>
                <label for="new_expires_at" class="block text-gray-300 text-sm font-bold mb-2">Expires At:</label>
                <input type="date" id="new_expires_at" name="new_expires_at" class="form-admin-input">
            </div>
            <div class="flex justify-end space-x-4 pt-4">
                <button type="button" onclick="closeEditModal()" class="btn-admin-secondary">Cancel</button>
                <button type="submit" name="update_license" class="btn-admin-primary">
                    <i class="fas fa-save mr-1"></i>Save Changes
                </button>
            </div>
        </form>
    </div>
</div>

<script>
    // Filter functionality
    const tierFilter = document.getElementById('tierFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchInput');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const licenseRows = document.querySelectorAll('.license-row');
    const licenseCount = document.getElementById('licenseCount');

    function applyFilters() {
        const tier = tierFilter.value.toLowerCase();
        const status = statusFilter.value.toLowerCase();
        const search = searchInput.value.toLowerCase();
        let visibleCount = 0;

        licenseRows.forEach(row => {
            const rowTier = row.dataset.tier.toLowerCase();
            const rowStatus = row.dataset.status.toLowerCase();
            const rowSearch = row.dataset.search;

            const tierMatch = tier === 'all' || rowTier.includes(tier);
            const statusMatch = status === 'all' || rowStatus === status;
            const searchMatch = search === '' || rowSearch.includes(search);

            if (tierMatch && statusMatch && searchMatch) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        licenseCount.textContent = `(${visibleCount} of ${licenseRows.length})`;
    }

    tierFilter.addEventListener('change', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    searchInput.addEventListener('input', applyFilters);

    clearFiltersBtn.addEventListener('click', () => {
        tierFilter.value = 'all';
        statusFilter.value = 'all';
        searchInput.value = '';
        applyFilters();
    });

    document.getElementById('refreshBtn').addEventListener('click', () => {
        location.reload();
    });

    // Edit modal
    function openEditModal(license) {
        document.getElementById('edit_license_id').value = license.id;
        document.getElementById('edit_license_key').value = license.license_key;
        document.getElementById('edit_customer_email').value = license.customer_email || 'N/A';
        document.getElementById('edit_product_name').value = license.product_name || 'N/A';
        document.getElementById('new_status').value = license.status;
        document.getElementById('new_max_devices').value = license.max_devices;
        document.getElementById('new_expires_at').value = license.expires_at ? license.expires_at.split(' ')[0] : '';
        document.getElementById('editLicenseModal').classList.remove('hidden');
    }

    function closeEditModal() {
        document.getElementById('editLicenseModal').classList.add('hidden');
    }

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeEditModal();
    });
</script>

<?php admin_footer(); ?>
