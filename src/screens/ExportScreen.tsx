import React, { useState } from 'react';
import { Organization } from '../types';
import {
  downloadFlutterProjectZip,
  FLUTTER_PUBSPEC_YAML,
  FLUTTER_MAIN_DART,
  FLUTTER_PRODUCT_GRID_DART,
  PHP_DB_CONNECT,
  PHP_API_SCRIPT,
  MYSQL_SCHEMA_SQL,
} from '../services/flutterExport';
import {
  Download,
  Code2,
  FileCode,
  Database,
  Smartphone,
  Monitor,
  Terminal,
  Copy,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ExportScreenProps {
  org: Organization;
}

export const ExportScreen: React.FC<ExportScreenProps> = ({ org }) => {
  const [activeCodeFile, setActiveCodeFile] = useState<
    'main.dart' | 'product_grid.dart' | 'pubspec.yaml' | 'schema.sql' | 'api.php' | 'db_connect.php'
  >('main.dart');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const getActiveCode = () => {
    switch (activeCodeFile) {
      case 'main.dart':
        return FLUTTER_MAIN_DART;
      case 'product_grid.dart':
        return FLUTTER_PRODUCT_GRID_DART;
      case 'pubspec.yaml':
        return FLUTTER_PUBSPEC_YAML;
      case 'schema.sql':
        return MYSQL_SCHEMA_SQL;
      case 'api.php':
        return PHP_API_SCRIPT;
      case 'db_connect.php':
        return PHP_DB_CONNECT;
      default:
        return '';
    }
  };

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      await downloadFlutterProjectZip(org);
    } catch (err) {
      console.error(err);
      alert('Failed to generate ZIP. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50 p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0d1b2a] to-blue-900 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Cross-Platform Flutter Dart & Offline PHP Engine</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Production-Ready Flutter ERP POS & phpMyAdmin Backend
          </h2>
          <p className="text-xs text-blue-200 max-w-2xl leading-relaxed">
            Download the complete source codebase ready for deployment to Windows Desktop (.exe), Android (.apk),
            Web, and offline local PHP/MySQL server. Captures all PRD & FRD specifications.
          </p>
        </div>

        <button
          type="button"
          disabled={isExporting}
          onClick={handleDownloadZip}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white rounded-2xl font-extrabold text-sm flex items-center gap-2 shadow-lg transition shrink-0"
        >
          {isExporting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          <span>{isExporting ? 'Packaging ZIP...' : 'Download Flutter Project (.ZIP)'}</span>
        </button>
      </div>

      {/* Deployment & Setup Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-blue-600 font-bold">
            <Monitor className="w-4 h-4" />
            <span>1. Windows Desktop .exe Build</span>
          </div>
          <p className="text-slate-500 text-[11px]">
            Unzip the folder, open in terminal and execute release compile:
          </p>
          <div className="p-2.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px]">
            flutter pub get<br />
            flutter build windows --release
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 font-bold">
            <Smartphone className="w-4 h-4" />
            <span>2. Android .apk Build</span>
          </div>
          <p className="text-slate-500 text-[11px]">
            Target Android POS terminals, Sunmi, and mobile handhelds:
          </p>
          <div className="p-2.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px]">
            flutter build apk --release<br />
            flutter install
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-purple-600 font-bold">
            <Database className="w-4 h-4" />
            <span>3. Offline phpMyAdmin & MySQL</span>
          </div>
          <p className="text-slate-500 text-[11px]">
            Put php files in <code>htdocs/bizora_pos/</code> and import:
          </p>
          <div className="p-2.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px]">
            mysql -u root -p &lt; schema.sql<br />
            http://localhost/phpmyadmin
          </div>
        </div>
      </div>

      {/* Code Inspector & Live Viewer */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Sub-header File Picker */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'main.dart', label: 'lib/main.dart', icon: FileCode },
              { id: 'product_grid.dart', label: 'lib/widgets/product_grid.dart', icon: FileCode },
              { id: 'pubspec.yaml', label: 'pubspec.yaml', icon: FileCode },
              { id: 'schema.sql', label: 'backend/schema.sql', icon: Database },
              { id: 'api.php', label: 'backend/api.php', icon: Code2 },
              { id: 'db_connect.php', label: 'backend/db_connect.php', icon: Code2 },
            ].map((f) => {
              const Icon = f.icon;
              const isSelected = activeCodeFile === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveCodeFile(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-mono font-semibold flex items-center gap-1.5 transition ${
                    isSelected
                      ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-semibold flex items-center gap-1.5 transition text-xs"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code Content Box */}
        <div className="flex-1 p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-auto leading-relaxed max-h-96">
          <pre>{getActiveCode()}</pre>
        </div>
      </div>
    </div>
  );
};
