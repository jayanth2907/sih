import 'dart:async';
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

class AppDatabase {
  static const String _databaseName = 'trinetra_local.db';
  static const int _databaseVersion = 1;

  static Database? _database;

  static Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  static Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, _databaseName);

    return await openDatabase(
      path,
      version: _databaseVersion,
      onCreate: _onCreate,
    );
  }

  static Future<void> _onCreate(Database db, int version) async {
    // 1. Local Inspection Queue Table
    await db.execute('''
      CREATE TABLE local_inspections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        local_id TEXT UNIQUE NOT NULL,
        server_id TEXT,
        mine_id INTEGER NOT NULL,
        mine_name TEXT,
        inspector_id INTEGER NOT NULL,
        status TEXT DEFAULT 'COMPLETED',
        gps_lat REAL NOT NULL,
        gps_lng REAL NOT NULL,
        notes TEXT,
        is_offline_sync INTEGER DEFAULT 1,
        sync_status TEXT DEFAULT 'PENDING',
        retry_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');

    // 2. Local Observations Table
    await db.execute('''
      CREATE TABLE local_observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        local_inspection_id TEXT NOT NULL,
        regulation_id INTEGER NOT NULL,
        regulation_code TEXT,
        severity TEXT NOT NULL,
        description TEXT NOT NULL,
        evidence_url TEXT,
        local_image_path TEXT,
        is_violation INTEGER DEFAULT 1,
        FOREIGN KEY (local_inspection_id) REFERENCES local_inspections (local_id) ON DELETE CASCADE
      )
    ''');

    // 3. Cached Regulations Table (for offline creation)
    await db.execute('''
      CREATE TABLE cached_regulations (
        id INTEGER PRIMARY KEY,
        code TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        response_sla_hours INTEGER NOT NULL
      )
    ''');

    // 4. Cached Mines Table (for offline selection)
    await db.execute('''
      CREATE TABLE cached_mines (
        id INTEGER PRIMARY KEY,
        mine_code TEXT NOT NULL,
        name TEXT NOT NULL,
        subsidiary TEXT NOT NULL,
        district TEXT,
        state TEXT,
        lat REAL,
        lng REAL,
        risk_score REAL,
        status TEXT,
        reporting_frequency_expected INTEGER,
        reporting_frequency_actual INTEGER
      )
    ''');

    // 5. Cached Violations Table (for offline viewing)
    await db.execute('''
      CREATE TABLE cached_violations (
        id INTEGER PRIMARY KEY,
        violation_code TEXT NOT NULL,
        mine_id INTEGER NOT NULL,
        regulation_id INTEGER,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        priority_score REAL,
        ml_probability REAL,
        recurrence_count INTEGER,
        peer_percentile REAL,
        reporting_drift REAL,
        external_discrepancy INTEGER,
        due_at TEXT,
        is_escalated INTEGER,
        created_at TEXT
      )
    ''');
  }

  static Future<void> clearAllData() async {
    final db = await database;
    await db.delete('local_observations');
    await db.delete('local_inspections');
    await db.delete('cached_regulations');
    await db.delete('cached_mines');
    await db.delete('cached_violations');
  }
}
