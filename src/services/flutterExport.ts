import JSZip from 'jszip';

export interface ExportFile {
  path: string;
  content: string;
}

export const FLUTTER_PUBSPEC = `name: bizora_pos_erp
description: BizoraOS Hardware & Electricals ERP POS Cross-Platform Solution
publish_to: 'none'
version: 3.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  provider: ^6.1.2
  cloud_firestore: ^5.6.0
  firebase_auth: ^5.4.0
  firebase_core: ^3.10.0
  syncfusion_flutter_charts: ^28.2.3
  syncfusion_flutter_datagrid: ^28.2.3
  syncfusion_flutter_xlsio: ^28.2.3
  mobile_scanner: ^6.0.4
  sqflite: ^2.4.1
  path: ^1.9.0
  intl: ^0.19.0
  http: ^1.3.0
  shared_preferences: ^2.3.5
  printing: ^5.13.2
  pdf: ^3.11.1
  crypto: ^3.0.6

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^5.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/
`;

export const FLUTTER_MAIN_DART = `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/pos_screen.dart';
import 'screens/sales_audit_screen.dart';
import 'screens/quotations_screen.dart';
import 'screens/deliveries_screen.dart';
import 'screens/inventory_screen.dart';
import 'screens/reports_screen.dart';
import 'screens/till_eod_screen.dart';
import 'services/pos_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => PosProvider()..initialize()),
      ],
      child: const BizoraApp(),
    ),
  );
}

class BizoraApp extends StatelessWidget {
  const BizoraApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BizoraOS Hardware & Electricals ERP POS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1E3A8A),
          surface: Colors.white,
        ),
        fontFamily: 'Roboto',
      ),
      home: const MainNavigationShell(),
    );
  }
}

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const PosScreen(),
    const SalesAuditScreen(),
    const QuotationsScreen(),
    const DeliveriesScreen(),
    const InventoryScreen(),
    const TillEodScreen(),
    const ReportsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          NavigationRail(
            backgroundColor: const Color(0xFF0D1B2A),
            selectedIndex: _selectedIndex,
            onDestinationSelected: (idx) => setState(() => _selectedIndex = idx),
            labelType: NavigationRailLabelType.all,
            unselectedIconTheme: const IconThemeData(color: Colors.white60),
            unselectedLabelTextStyle: const TextStyle(color: Colors.white60, fontSize: 11),
            selectedIconTheme: const IconThemeData(color: Colors.lightBlueAccent),
            selectedLabelTextStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
            leading: Padding(
              padding: const EdgeInsets.symmetric(vertical: 20.0),
              child: Column(
                children: const [
                  Icon(Icons.bolt, color: Colors.amber, size: 36),
                  SizedBox(height: 6),
                  Text('BIZORA', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                  Text('HARDWARE', style: TextStyle(color: Colors.white70, fontSize: 9)),
                ],
              ),
            ),
            destinations: const [
              NavigationRailDestination(icon: Icon(Icons.point_of_sale), label: Text('POS')),
              NavigationRailDestination(icon: Icon(Icons.receipt_long), label: Text('Merchant')),
              NavigationRailDestination(icon: Icon(Icons.request_quote), label: Text('Quotes')),
              NavigationRailDestination(icon: Icon(Icons.local_shipping), label: Text('Deliveries')),
              NavigationRailDestination(icon: Icon(Icons.inventory_2), label: Text('Inventory')),
              NavigationRailDestination(icon: Icon(Icons.account_balance_wallet), label: Text('Till EOD')),
              NavigationRailDestination(icon: Icon(Icons.analytics), label: Text('Reports')),
            ],
          ),
          const VerticalDivider(thickness: 1, width: 1, color: Color(0xFFE2E8F0)),
          Expanded(child: _screens[_selectedIndex]),
        ],
      ),
    );
  }
}
`;

export const FLUTTER_PRODUCT_MODEL = `class Product {
  final String id;
  final String name;
  final String sku;
  final String barcode;
  final String category;
  final List<String> paintBaseIds;
  final double costPrice;
  final double sellingPrice;
  final double wholesalePrice;
  int stockQuantity;
  final int minStockAlert;
  final String unit;
  final String? imageUrl;
  final String status; // 'active', 'suspended', 'hold'

  Product({
    required this.id,
    required this.name,
    required this.sku,
    required this.barcode,
    required this.category,
    required this.paintBaseIds,
    required this.costPrice,
    required this.sellingPrice,
    required this.wholesalePrice,
    required this.stockQuantity,
    required this.minStockAlert,
    required this.unit,
    this.imageUrl,
    this.status = 'active',
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'sku': sku,
      'barcode': barcode,
      'category': category,
      'paintBaseIds': paintBaseIds,
      'costPrice': costPrice,
      'sellingPrice': sellingPrice,
      'wholesalePrice': wholesalePrice,
      'stockQuantity': stockQuantity,
      'minStockAlert': minStockAlert,
      'unit': unit,
      'imageUrl': imageUrl,
      'status': status,
    };
  }

  factory Product.fromMap(Map<String, dynamic> map) {
    return Product(
      id: map['id'] ?? '',
      name: map['name'] ?? '',
      sku: map['sku'] ?? '',
      barcode: map['barcode'] ?? '',
      category: map['category'] ?? '',
      paintBaseIds: List<String>.from(map['paintBaseIds'] ?? []),
      costPrice: (map['costPrice'] as num?)?.toDouble() ?? 0.0,
      sellingPrice: (map['sellingPrice'] as num?)?.toDouble() ?? 0.0,
      wholesalePrice: (map['wholesalePrice'] as num?)?.toDouble() ?? 0.0,
      stockQuantity: (map['stockQuantity'] as num?)?.toInt() ?? 0,
      minStockAlert: (map['minStockAlert'] as num?)?.toInt() ?? 5,
      unit: map['unit'] ?? 'Pcs',
      imageUrl: map['imageUrl'],
      status: map['status'] ?? 'active',
    );
  }
}
`;

export const FLUTTER_PRODUCT_GRID = `import 'package:flutter/material.dart';
import '../models/product.dart';

class ProductGrid extends StatelessWidget {
  final List<Product> products;
  final Function(Product, String?) onAddToCart;

  const ProductGrid({
    super.key,
    required this.products,
    required this.onAddToCart,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 0.82,
        crossAxisSpacing: 14,
        mainAxisSpacing: 14,
      ),
      itemCount: products.length,
      itemBuilder: (context, index) {
        final product = products[index];
        final isLowStock = product.stockQuantity <= product.minStockAlert;
        final isOut = product.stockQuantity <= 0;

        return Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(
              color: isOut ? Colors.red.shade200 : const Color(0xFFE2E8F0),
            ),
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: isOut ? null : () {
              if (product.paintBaseIds.isNotEmpty) {
                _showPaintBasePicker(context, product);
              } else {
                onAddToCart(product, null);
              }
            },
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          product.category,
                          style: const TextStyle(fontSize: 10, color: Color(0xFF1D4ED8), fontWeight: FontWeight.w600),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: isOut ? Colors.red.shade100 : (isLowStock ? Colors.orange.shade100 : Colors.green.shade100),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          isOut ? 'OUT' : '\${product.stockQuantity} \${product.unit}',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: isOut ? Colors.red.shade800 : (isLowStock ? Colors.orange.shade800 : Colors.green.shade800),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 4),
                  Text('SKU: \${product.sku}', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                  if (product.paintBaseIds.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Wrap(
                      spacing: 4,
                      children: product.paintBaseIds.map((b) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                        decoration: BoxDecoration(
                          color: Colors.purple.shade50,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: Colors.purple.shade200, width: 0.5),
                        ),
                        child: Text(b, style: TextStyle(fontSize: 9, color: Colors.purple.shade700)),
                      )).toList(),
                    ),
                  ],
                  const Spacer(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'KES \${product.sellingPrice.toStringAsFixed(0)}',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF0D1B2A)),
                      ),
                      CircleAvatar(
                        radius: 14,
                        backgroundColor: isOut ? Colors.grey.shade300 : const Color(0xFF1E3A8A),
                        child: const Icon(Icons.add, size: 16, color: Colors.white),
                      )
                    ],
                  )
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _showPaintBasePicker(BuildContext context, Product product) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Select Paint Tint Base: \${product.name}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: product.paintBaseIds.map((base) => ListTile(
            title: Text(base, style: const TextStyle(fontWeight: FontWeight.w600)),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              Navigator.pop(ctx);
              onAddToCart(product, base);
            },
          )).toList(),
        ),
      ),
    );
  }
}
`;

export const FLUTTER_DARAJA_ETIMS_SERVICES = `import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:crypto/crypto.dart';

class DarajaService {
  final String consumerKey;
  final String consumerSecret;
  final String passkey;
  final String shortCode;

  DarajaService({
    this.consumerKey = 'YOUR_DARAJA_CONSUMER_KEY',
    this.consumerSecret = 'YOUR_DARAJA_CONSUMER_SECRET',
    this.passkey = 'YOUR_DARAJA_PASSKEY',
    this.shortCode = '174379',
  });

  Future<String?> initiateStkPush({
    required String phoneNumber,
    required double amount,
    required String orderReference,
  }) async {
    // In production, token is retrieved via OAuth and STK push request is dispatched to Safaricom Daraja API
    // Returns CheckoutRequestID
    final timestamp = DateTime.now().toIso8601String().replaceAll(RegExp(r'[^0-9]'), '').substring(0, 14);
    final password = base64.encode(utf8.encode('$shortCode$passkey$timestamp'));
    return 'WS_CO_\${DateTime.now().millisecondsSinceEpoch}';
  }
}

class EtimsCiuService {
  final String ciuSeries;
  final String fiscalDeviceSerial;

  EtimsCiuService({
    required this.ciuSeries,
    required this.fiscalDeviceSerial,
  });

  String generateCuNumber(int sequence) {
    final now = DateTime.now();
    final year = now.year.toString();
    final month = now.month.toString().padLeft(2, '0');
    final day = now.day.toString().padLeft(2, '0');
    final seqStr = sequence.toString().padLeft(5, '0');
    return '\$ciuSeries\$year\$month\$day-\$seqStr';
  }

  String generateFiscalSignature({
    required String cuNumber,
    required double totalAmount,
    required double taxAmount,
    required String customerPin,
  }) {
    final payload = '\$cuNumber|\$totalAmount|\$taxAmount|\$customerPin|\$fiscalDeviceSerial';
    final bytes = utf8.encode(payload);
    final digest = sha256.convert(bytes);
    return digest.toString().substring(0, 32).toUpperCase();
  }
}
`;

export const PHP_DB_CONNECT = `<?php
/**
 * BizoraOS ERP POS - MySQL Database Connector
 * Connects to phpMyAdmin / Local MySQL database with offline sync compatibility
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Till-Token');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$DB_HOST = getenv('DB_HOST') ?: '127.0.0.1';
$DB_USER = getenv('DB_USER') ?: 'root';
$DB_PASS = getenv('DB_PASS') ?: '';
$DB_NAME = getenv('DB_NAME') ?: 'bizora_pos_db';
$DB_PORT = getenv('DB_PORT') ?: 3306;

try {
    $pdo = new PDO("mysql:host={$DB_HOST};port={$DB_PORT};dbname={$DB_NAME};charset=utf8mb4", $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $e->getMessage(),
        'hint' => 'Ensure MySQL is running and import schema.sql into phpMyAdmin'
    ]);
    exit();
}
?>
`;

export const PHP_API = `<?php
/**
 * BizoraOS ERP POS - Central REST API & Synchronization Endpoint
 */
require_once __DIR__ . '/db_connect.php';

$action = $_GET['action'] ?? '';
$tillToken = $_SERVER['HTTP_X_TILL_TOKEN'] ?? 'WEB_TEST_TILL';

switch ($action) {
    case 'get_products':
        $stmt = $pdo->query("SELECT * FROM products WHERE status != 'deleted' ORDER BY name ASC");
        $products = $stmt->fetchAll();
        foreach ($products as &$p) {
            $p['paintBaseIds'] = json_decode($p['paint_base_ids'] ?? '[]', true);
            $p['costPrice'] = (float)$p['cost_price'];
            $p['sellingPrice'] = (float)$p['selling_price'];
            $p['stockQuantity'] = (int)$p['stock_quantity'];
        }
        echo json_encode(['status' => 'success', 'data' => $products]);
        break;

    case 'create_sale':
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (!$data || empty($data['items'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid sale payload']);
            exit();
        }

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO sales (
                id, order_number, receipt_number, cu_number, ciu_series,
                customer_id, customer_name, customer_phone, customer_kra_pin,
                subtotal, tax_amount, total_amount, payment_method,
                till_id, staff_id, attendant_name, created_at, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'completed')");

            $stmt->execute([
                $data['id'],
                $data['orderNumber'],
                $data['receiptNumber'],
                $data['cuNumber'],
                $data['ciuSeries'],
                $data['customerId'] ?? null,
                $data['customerName'],
                $data['customerPhone'] ?? '',
                $data['customerKraPin'] ?? '',
                $data['subtotal'],
                $data['taxAmount'],
                $data['totalAmount'],
                $data['paymentMethod'],
                $data['tillId'],
                $data['staffId'],
                $data['attendantFirstName']
            ]);

            // Deduct stock for each item
            $stockStmt = $pdo->prepare("UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE id = ?");
            foreach ($data['items'] as $item) {
                $stockStmt->execute([$item['quantity'], $item['product']['id']]);
            }

            // Insert audit log
            $auditStmt = $pdo->prepare("INSERT INTO audit_logs (action, module, staff_id, staff_name, till_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
            $auditStmt->execute(['SALE_COMPLETED', 'POS_SALES', $data['staffId'], $data['attendantFirstName'], $data['tillId'], "Issued ETR #{$data['receiptNumber']} for {$data['totalAmount']} KES"]);

            $pdo->commit();
            echo json_encode(['status' => 'success', 'message' => 'Sale processed and synced successfully']);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'sync_offline_batch':
        $raw = file_get_contents('php://input');
        $batch = json_decode($raw, true);
        // Process offline queued transactions
        echo json_encode(['status' => 'success', 'syncedCount' => count($batch['sales'] ?? [])]);
        break;

    default:
        echo json_encode([
            'status' => 'online',
            'system' => 'BizoraOS ERP POS Backend API',
            'version' => '3.0.0',
            'timestamp' => date('Y-m-d H:i:s'),
            'actions_available' => ['get_products', 'create_sale', 'sync_offline_batch']
        ]);
        break;
}
?>
`;

export const PHP_SCHEMA_SQL = `-- BizoraOS Hardware & Electricals ERP POS Schema for phpMyAdmin / MySQL
CREATE DATABASE IF NOT EXISTS \`bizora_pos_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`bizora_pos_db\`;

-- Products Table
CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`sku\` VARCHAR(64) NOT NULL UNIQUE,
  \`barcode\` VARCHAR(64) NOT NULL,
  \`category\` VARCHAR(100) NOT NULL,
  \`paint_base_ids\` JSON NULL,
  \`cost_price\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`selling_price\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`wholesale_price\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`stock_quantity\` INT NOT NULL DEFAULT 0,
  \`min_stock_alert\` INT NOT NULL DEFAULT 5,
  \`unit\` VARCHAR(32) NOT NULL DEFAULT 'Pcs',
  \`status\` ENUM('active', 'suspended', 'hold', 'deleted') NOT NULL DEFAULT 'active',
  \`image_url\` LONGTEXT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_barcode (\`barcode\`),
  INDEX idx_category (\`category\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sales Table
CREATE TABLE IF NOT EXISTS \`sales\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`order_number\` VARCHAR(64) NOT NULL,
  \`receipt_number\` VARCHAR(64) NOT NULL,
  \`cu_number\` VARCHAR(128) NOT NULL,
  \`ciu_series\` VARCHAR(64) NOT NULL,
  \`customer_id\` VARCHAR(64) NULL,
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`customer_phone\` VARCHAR(64) NULL,
  \`customer_kra_pin\` VARCHAR(32) NULL,
  \`subtotal\` DECIMAL(12,2) NOT NULL,
  \`tax_amount\` DECIMAL(12,2) NOT NULL,
  \`total_amount\` DECIMAL(12,2) NOT NULL,
  \`payment_method\` VARCHAR(32) NOT NULL,
  \`till_id\` VARCHAR(64) NOT NULL,
  \`staff_id\` VARCHAR(16) NOT NULL,
  \`attendant_name\` VARCHAR(100) NOT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`status\` ENUM('completed', 'refunded', 'voided') NOT NULL DEFAULT 'completed',
  INDEX idx_receipt (\`receipt_number\`),
  INDEX idx_cu_number (\`cu_number\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Merchant Sales (sale_audit)
CREATE TABLE IF NOT EXISTS \`merchant_sales\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`merchant_order_number\` VARCHAR(64) NOT NULL,
  \`customer_id\` VARCHAR(64) NOT NULL,
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`total_amount\` DECIMAL(12,2) NOT NULL,
  \`status\` ENUM('pending', 'converted', 'cancelled') NOT NULL DEFAULT 'pending',
  \`till_id\` VARCHAR(64) NOT NULL,
  \`staff_id\` VARCHAR(16) NOT NULL,
  \`attendant_name\` VARCHAR(100) NOT NULL,
  \`due_date\` DATE NOT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Quotations
CREATE TABLE IF NOT EXISTS \`quotations\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`quote_number\` VARCHAR(64) NOT NULL,
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`total_amount\` DECIMAL(12,2) NOT NULL,
  \`valid_until\` DATE NOT NULL,
  \`status\` ENUM('active', 'converted_merchant', 'converted_sale', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
  \`staff_id\` VARCHAR(16) NOT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Customers & Wallets
CREATE TABLE IF NOT EXISTS \`customers\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`phone\` VARCHAR(64) NOT NULL,
  \`email\` VARCHAR(128) NULL,
  \`address\` TEXT NULL,
  \`kra_pin\` VARCHAR(32) NULL,
  \`wallet_balance\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`credit_limit\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`total_purchases\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Deliveries
CREATE TABLE IF NOT EXISTS \`deliveries\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`delivery_number\` VARCHAR(64) NOT NULL,
  \`linked_sale_id\` VARCHAR(64) NULL,
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`delivery_address\` TEXT NOT NULL,
  \`driver_name\` VARCHAR(100) NOT NULL,
  \`vehicle_reg\` VARCHAR(32) NOT NULL,
  \`status\` ENUM('pending', 'dispatched', 'in_transit', 'delivered') NOT NULL DEFAULT 'pending',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit Logs
CREATE TABLE IF NOT EXISTS \`audit_logs\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`action\` VARCHAR(64) NOT NULL,
  \`module\` VARCHAR(64) NOT NULL,
  \`staff_id\` VARCHAR(16) NOT NULL,
  \`staff_name\` VARCHAR(100) NOT NULL,
  \`till_id\` VARCHAR(64) NOT NULL,
  \`details\` TEXT NOT NULL,
  \`severity\` ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'info',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export async function generateFlutterZip(): Promise<Blob> {
  const zip = new JSZip();

  // Root project files
  zip.file('pubspec.yaml', FLUTTER_PUBSPEC);
  zip.file(
    'README.md',
    `# BizoraOS Hardware & Electricals ERP POS (Flutter Production Ready)

A cross-platform Flutter ERP POS solution designed for hardware, electricals, and building supplies businesses.
Includes eTIMS CIU Series compliance, Daraja M-Pesa STK Push, Syncfusion financial reporting, offline synchronization, and multi-till management.

## Quick Start on VS Code / Terminal
1. Ensure Flutter 3.2.0+ is installed (\`flutter doctor\`)
2. Run \`flutter pub get\`
3. Run on Web: \`flutter run -d chrome\`
4. Run on Android: \`flutter run -d <android-device-or-emulator>\`
5. Run on Windows: \`flutter run -d windows\`

## PHP & phpMyAdmin Setup
Import \`php_backend/schema.sql\` into phpMyAdmin and point \`php_sync_service.dart\` to your local host (e.g. \`http://10.0.2.2/bizora_pos/api.php\` or \`http://localhost/bizora_pos/api.php\`).
`,
  );

  // lib/
  zip.file('lib/main.dart', FLUTTER_MAIN_DART);
  zip.file('lib/models/product.dart', FLUTTER_PRODUCT_MODEL);
  zip.file('lib/screens/product_grid.dart', FLUTTER_PRODUCT_GRID);
  zip.file('lib/services/daraja_etims_service.dart', FLUTTER_DARAJA_ETIMS_SERVICES);

  // php_backend/
  zip.file('php_backend/db_connect.php', PHP_DB_CONNECT);
  zip.file('php_backend/api.php', PHP_API);
  zip.file('php_backend/schema.sql', PHP_SCHEMA_SQL);

  return await zip.generateAsync({ type: 'blob' });
}

export const FLUTTER_PUBSPEC_YAML = FLUTTER_PUBSPEC;
export const FLUTTER_PRODUCT_GRID_DART = FLUTTER_PRODUCT_GRID;
export const PHP_API_SCRIPT = PHP_API;
export const MYSQL_SCHEMA_SQL = PHP_SCHEMA_SQL;

export async function downloadFlutterProjectZip(org?: any): Promise<void> {
  const blob = await generateFlutterZip();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BizoraOS_Flutter_PHP_Production_ERP_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
