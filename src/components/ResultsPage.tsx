import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BarChart3,
  Building2,
  Check,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Flame,
  GraduationCap,
  History,
  Library,
  List,
  MapPin,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import ComparisonModal from './ComparisonModal';
import StrategyModal from './StrategyModal';
import { ALL_REGIONS } from './RegionModal';
import { exportExcel, exportJson, exportTxt, printResults } from '../lib/exportUtils';
import { formatSchoolOwnership, getSchoolOwnershipKey } from '../lib/schoolDisplay';
import { loadAdmissionResult } from '../lib/resultStorage';
import { withBasePath } from '../lib/routes';

const zoneMeta: Record<string, { label: string; short: string; icon: React.ComponentType<{ className?: string }>; card: string; badge: string; text: string }> = {
  reach: {
    label: '挑戰區',
    short: 'Reach',
    icon: Flame,
    card: 'bg-rose-50 border-rose-200',
    badge: 'bg-rose-500 text-white border-rose-700',
    text: 'text-rose-700',
  },
  target: {
    label: '適中區',
    short: 'Target',
    icon: Target,
    card: 'bg-sky-50 border-sky-200',
    badge: 'bg-sky-500 text-white border-sky-700',
    text: 'text-sky-700',
  },
  safe: {
    label: '保守區',
    short: 'Safe',
    icon: ShieldCheck,
    card: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-500 text-white border-emerald-700',
    text: 'text-emerald-700',
  },
};

const zoneOrder: Record<string, number> = { reach: 0, target: 1, safe: 2 };

const gradeLabels: Record<string, string> = {
  chinese: '國文',
  english: '英文',
  math: '數學',
  science: '自然',
  social: '社會',
  composition: '作文',
};

const normalizeHistoricalScores = (scores: any[] = []) =>
  scores
    .filter((item) => item && item.points !== null && item.points !== undefined)
    .map((item) => ({
      ...item,
      year: String(item.year || '歷年'),
      numericYear: Number.parseInt(String(item.year || '').replace(/\D/g, ''), 10),
    }))
    .sort((a, b) => (Number.isFinite(b.numericYear) ? b.numericYear : 0) - (Number.isFinite(a.numericYear) ? a.numericYear : 0));

const formatHistoricalCredits = (credits: any) =>
  credits !== null && credits !== undefined && credits !== '' ? credits : '--';

const getRegionName = (regionId: string) =>
  ALL_REGIONS.find((region) => region.id === regionId)?.name || regionId || '未選擇';

const getSchoolTypeLabel = (type: string) => {
  if (!type || type === 'all') return '全部類型';
  return type;
};

const getOwnershipLabel = (ownership: string) => {
  if (ownership === 'all') return '公私立皆可';
  return formatSchoolOwnership(ownership);
};

export default function ResultsPage() {
  const payload = loadAdmissionResult();
  const [query, setQuery] = useState('');
  const [zone, setZone] = useState('all');
  const [ownership, setOwnership] = useState('all');
  const [type, setType] = useState('all');
  const [comparisonSchools, setComparisonSchools] = useState<any[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isStrategyOpen, setIsStrategyOpen] = useState(false);
  const [historicalSchool, setHistoricalSchool] = useState<any | null>(null);

  const results = payload?.results;
  const formData = payload?.formData || {};
  const schools = results?.eligibleSchools || [];
  const regionName = getRegionName(formData.region);

  const filteredSchools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return schools
      .filter((school: any) => {
        const searchable = `${school.name || ''} ${school.type || ''} ${school.group || ''} ${school.district || ''}`.toLowerCase();
        const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
        const matchesZone = zone === 'all' || school.zone === zone;
        const matchesOwnership = ownership === 'all' || getSchoolOwnershipKey(school.ownership) === ownership;
        const matchesType =
          type === 'all' ||
          (type === 'general' && !school.group) ||
          (type === 'vocational' && Boolean(school.group));

        return matchesQuery && matchesZone && matchesOwnership && matchesType;
      })
      .sort((a: any, b: any) => {
        const zoneDiff = (zoneOrder[a.zone] ?? 99) - (zoneOrder[b.zone] ?? 99);
        if (zoneDiff !== 0) return zoneDiff;

        const aDistance = Math.abs(a.scoreDiff ?? a.pointsDiff ?? a.distanceScore ?? 0);
        const bDistance = Math.abs(b.scoreDiff ?? b.pointsDiff ?? b.distanceScore ?? 0);
        return aDistance - bDistance || (b.points ?? 0) - (a.points ?? 0);
      });
  }, [ownership, query, schools, type, zone]);

  const zoneCounts = {
    reach: results?.analysisReport?.zoneCounts?.reach ?? schools.filter((school: any) => school.zone === 'reach').length,
    target: results?.analysisReport?.zoneCounts?.target ?? schools.filter((school: any) => school.zone === 'target').length,
    safe: results?.analysisReport?.zoneCounts?.safe ?? schools.filter((school: any) => school.zone === 'safe').length,
  };

  const exportPayload = { scores: formData, results, identity: formData.identity, vocationalGroups: payload?.vocationalGroups || [] };

  const toggleComparison = (school: any) => {
    setComparisonSchools((current) => {
      if (current.some((item) => item.name === school.name)) {
        return current.filter((item) => item.name !== school.name);
      }
      if (current.length >= 4) {
        window.alert('最多可比較 4 所學校');
        return current;
      }
      return [...current, { ...school, region: school.district || regionName }];
    });
  };

  if (!payload || !results) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16 text-slate-900">
        <div className="mx-auto max-w-2xl rounded-3xl border-4 border-slate-900 bg-white p-8 text-center shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-slate-900 bg-amber-300">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black">找不到本次落點結果</h1>
          <p className="mt-3 font-bold text-slate-500">請回到分析頁重新輸入資料並產生結果。</p>
          <a
            href={withBasePath('/')}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-slate-900 px-5 py-3 font-black text-white shadow-[4px_4px_0px_0px_rgba(251,191,36,1)]"
          >
            <ArrowLeft className="h-5 w-5" />
            回到分析頁
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b-4 border-slate-900 bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <a href={withBasePath('/')} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-emerald-200 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                回到分析頁
              </a>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-white bg-indigo-500 shadow-[4px_4px_0px_0px_rgba(16,185,129,1)]">
                  <Award className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">落點分析結果</h1>
                  <p className="mt-1 text-sm font-bold text-slate-300">
                    {regionName} · {payload.createdAt ? new Date(payload.createdAt).toLocaleString('zh-TW') : '剛剛建立'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => exportExcel(exportPayload, regionName)}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-100"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </button>
              <button
                type="button"
                onClick={() => exportTxt(exportPayload, regionName)}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white bg-slate-800 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-700"
              >
                <Download className="h-4 w-4" />
                TXT
              </button>
              <button
                type="button"
                onClick={() => exportJson(exportPayload)}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/20"
              >
                <Download className="h-4 w-4" />
                JSON
              </button>
              <button
                type="button"
                onClick={() => printResults(exportPayload, regionName)}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-200"
              >
                <Printer className="h-4 w-4" />
                列印
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-3xl border-4 border-slate-900 bg-white p-5 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-black">總覽</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="總積分" value={results.totalPoints ?? '--'} tone="bg-indigo-50 text-indigo-700" />
              <Metric label="總積點" value={results.totalCredits ?? '--'} tone="bg-emerald-50 text-emerald-700" />
              <Metric label="推薦校系" value={schools.length} tone="bg-amber-50 text-amber-700" />
              <Metric label="目前顯示" value={filteredSchools.length} tone="bg-slate-100 text-slate-700" />
            </div>
          </div>

          <div className="rounded-3xl border-4 border-slate-900 bg-white p-5 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
            <h2 className="mb-4 text-lg font-black">區間分布</h2>
            <div className="space-y-3">
              {(['reach', 'target', 'safe'] as const).map((key) => {
                const meta = zoneMeta[key];
                const Icon = meta.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setZone(zone === key ? 'all' : key)}
                    className={`flex w-full items-center justify-between rounded-2xl border-2 p-3 text-left transition hover:-translate-y-0.5 ${meta.card} ${
                      zone === key ? 'border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]' : 'border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-900 bg-white">
                        <Icon className={`h-5 w-5 ${meta.text}`} />
                      </span>
                      <span>
                        <span className="block font-black">{meta.label}</span>
                        <span className="text-xs font-bold text-slate-500">{meta.short}</span>
                      </span>
                    </span>
                    <span className={`rounded-xl border px-3 py-1 text-lg font-black ${meta.badge}`}>{zoneCounts[key]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border-4 border-slate-900 bg-amber-50 p-5 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
            <h2 className="mb-3 text-lg font-black">本次條件</h2>
            <InfoRow label="身分" value={formData.identity === 'teacher' ? '老師' : formData.identity === 'parent' ? '家長' : '學生'} />
            <InfoRow label="地區" value={regionName} />
            <InfoRow label="屬性" value={getOwnershipLabel(formData.schoolOwnership)} />
            <InfoRow label="類型" value={getSchoolTypeLabel(formData.schoolType)} />
            <div className="mt-3 grid grid-cols-3 gap-2">
              {Object.entries(gradeLabels).map(([key, label]) => (
                <div key={key} className="rounded-xl border-2 border-slate-900 bg-white p-2 text-center">
                  <div className="text-[11px] font-black text-slate-500">{label}</div>
                  <div className="text-sm font-black text-slate-900">{formData[key] || '--'}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          {results.analysisReport && (
            <div className="rounded-3xl border-4 border-slate-900 bg-white shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
              <div className="border-b-4 border-slate-900 bg-indigo-500 p-5 text-white">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-6 w-6 text-amber-200" />
                    <h2 className="text-2xl font-black">AI 策略摘要</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsStrategyOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-amber-300 px-4 py-2.5 text-sm font-black text-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition hover:bg-amber-200"
                  >
                    <Target className="h-4 w-4" />
                    策略說明
                  </button>
                </div>
              </div>
              <div className="grid gap-4 p-5 lg:grid-cols-[1fr_0.85fr]">
                <div className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-5">
                  <div className="mb-2 text-sm font-black text-slate-500">分析重點</div>
                  <p className="text-lg font-black leading-relaxed text-slate-900">{results.analysisReport.analysisSummary}</p>
                </div>
                <div className="rounded-2xl border-2 border-slate-900 bg-indigo-50 p-5">
                  <div className="mb-2 text-sm font-black text-indigo-700">建議方向</div>
                  <p className="text-sm font-bold leading-relaxed text-slate-700">{results.analysisReport.suggestion}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-3xl border-4 border-slate-900 bg-white p-4 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-2xl font-black">推薦校系</h2>
                <p className="text-sm font-bold text-slate-500">依落點區間與分數距離排序，可即時篩選與比較。</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIsComparisonOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-indigo-50 px-4 py-2.5 text-sm font-black text-indigo-700 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                >
                  <List className="h-4 w-4" />
                  比較清單 ({comparisonSchools.length})
                </button>
                <a
                  href={withBasePath('/mock-volunteer')}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-sky-50 px-4 py-2.5 text-sm font-black text-sky-700 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                >
                  <GraduationCap className="h-4 w-4" />
                  模擬志願
                </a>
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <label htmlFor="result-search" className="sr-only">搜尋學校、科別或地區</label>
                <input
                  id="result-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜尋學校、科別或地區..."
                  className="h-11 w-full rounded-xl border-2 border-slate-900 bg-white pl-9 pr-3 text-sm font-bold outline-none focus:bg-amber-50"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Select label="落點" value={zone} onChange={setZone} options={[['all', '全部'], ['reach', '挑戰'], ['target', '適中'], ['safe', '保守']]} />
                <Select label="屬性" value={ownership} onChange={setOwnership} options={[['all', '全部'], ['public', '公立'], ['private', '私立']]} />
                <Select label="類型" value={type} onChange={setType} options={[['all', '全部'], ['general', '普通'], ['vocational', '技職']]} />
              </div>
            </div>
          </div>

          {filteredSchools.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredSchools.map((school: any, index: number) => (
                <SchoolCard
                  key={`${school.name}-${school.group || 'general'}-${index}`}
                  school={school}
                  rank={index + 1}
                  regionName={school.district || regionName}
                  isCompared={comparisonSchools.some((item) => item.name === school.name)}
                  onToggleCompare={() => toggleComparison(school)}
                  onOpenHistory={() => setHistoricalSchool(school)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border-4 border-dashed border-slate-300 bg-white p-12 text-center">
              <Search className="mx-auto h-12 w-12 text-slate-300" />
              <div className="mt-3 text-xl font-black text-slate-700">沒有符合篩選的校系</div>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setZone('all');
                  setOwnership('all');
                  setType('all');
                }}
                className="mt-5 rounded-xl border-2 border-slate-900 bg-slate-900 px-5 py-2.5 font-black text-white"
              >
                清除篩選
              </button>
            </div>
          )}
        </section>
      </div>

      <ComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        schools={comparisonSchools}
        onRemove={(name) => setComparisonSchools((current) => current.filter((school) => school.name !== name))}
        onClear={() => setComparisonSchools([])}
      />
      <StrategyModal isOpen={isStrategyOpen} onClose={() => setIsStrategyOpen(false)} />
      <HistoricalScoresModal school={historicalSchool} onClose={() => setHistoricalSchool(null)} />
    </main>
  );
}

function HistoricalScoresModal({ school, onClose }: { school: any | null; onClose: () => void }) {
  if (!school) return null;

  const scores = normalizeHistoricalScores(school.historicalScores || []).slice(0, 8);

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="historical-scores-title"
        className="relative flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-[2rem] border-4 border-slate-900 bg-white shadow-[10px_10px_0px_0px_rgba(15,23,42,1)]"
      >
        <div className="flex items-start justify-between gap-4 border-b-4 border-slate-900 bg-amber-300 p-5">
          <div className="min-w-0">
            <div className="text-xs font-black text-amber-900">歷年錄取參考</div>
            <h2 id="historical-scores-title" className="break-words text-2xl font-black leading-tight text-slate-900">
              {school.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉歷年成績"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-slate-900 bg-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="custom-scrollbar overflow-y-auto bg-slate-50 p-5">
          {scores.length > 0 ? (
            <div className="space-y-3">
              {scores.map((item: any) => (
                <div
                  key={`${item.year}-${item.points}-${item.credits ?? 'none'}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]"
                >
                  <div>
                    <div className="text-lg font-black text-slate-900">{item.year}</div>
                    <div className="text-xs font-bold text-slate-500">錄取參考資料</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-indigo-600">分數 {item.points ?? '--'}</div>
                    <div className="text-sm font-black text-emerald-700">積點 {formatHistoricalCredits(item.credits)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
              <History className="mx-auto h-10 w-10 text-slate-300" />
              <div className="mt-3 text-xl font-black text-slate-900">尚無歷年成績資料</div>
              <p className="mt-2 text-sm font-bold text-slate-500">若資料來源更新，這裡會顯示歷年分數與積點。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: React.ReactNode; tone: string }) {
  return (
    <div className={`rounded-2xl border-2 border-slate-900 p-3 ${tone}`}>
      <div className="text-xs font-black opacity-70">{label}</div>
      <div className="mt-1 text-2xl font-black leading-none">{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-amber-200 py-2 last:border-b-0">
      <span className="text-sm font-black text-slate-500">{label}</span>
      <span className="text-sm font-black text-slate-900">{value}</span>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-black text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl border-2 border-slate-900 bg-white px-2 text-sm font-black outline-none focus:bg-amber-50"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function SchoolCard({
  school,
  rank,
  regionName,
  isCompared,
  onToggleCompare,
  onOpenHistory,
}: {
  key?: React.Key;
  school: any;
  rank: number;
  regionName: string;
  isCompared: boolean;
  onToggleCompare: () => void;
  onOpenHistory: () => void;
}) {
  const meta = zoneMeta[school.zone] || zoneMeta.target;
  const ZoneIcon = meta.icon;
  const ownership = formatSchoolOwnership(school.ownership || 'public');
  const OwnershipIcon = getSchoolOwnershipKey(school.ownership) === 'private' ? Building2 : Library;
  const threshold = school.minScore || school.points || school.score || '--';
  const distance = school.scoreDiff ?? school.pointsDiff ?? school.distanceScore;
  const historicalScores = normalizeHistoricalScores(school.historicalScores || []);
  const latestHistoricalScore = historicalScores[0];

  return (
    <article className="relative overflow-hidden rounded-3xl border-4 border-slate-900 bg-white p-5 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] transition hover:-translate-y-1 hover:shadow-[9px_9px_0px_0px_rgba(15,23,42,1)]">
      <div className="absolute -right-4 -top-5 text-[7rem] font-black leading-none text-slate-100">{rank}</div>
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-900 bg-amber-300 text-xl font-black shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            {rank}
          </div>
          <div className="min-w-0">
            <h3 className="break-words text-xl font-black leading-tight text-slate-900">{school.name}</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-black ${meta.badge}`}>
                <ZoneIcon className="h-3.5 w-3.5" />
                {meta.label}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">
                <OwnershipIcon className="h-3.5 w-3.5" />
                {ownership}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="類型" value={school.type || '普通'} />
        <MiniStat label="科群" value={school.group || '一般'} />
        <MiniStat label="地區" value={regionName} />
        <MiniStat label="門檻" value={threshold} />
      </div>

      {(school.analysisNote || distance !== undefined) && (
        <div className={`relative z-10 mt-4 rounded-2xl border-2 p-3 ${meta.card}`}>
          <div className="text-xs font-black text-slate-500">落點說明</div>
          <p className="mt-1 text-sm font-bold leading-relaxed text-slate-700">
            {school.analysisNote || `與參考門檻差距：${distance > 0 ? '+' : ''}${distance}`}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onOpenHistory}
        className="relative z-10 mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-slate-900 bg-amber-50 px-3 py-3 text-left shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition hover:-translate-y-0.5 hover:bg-amber-100"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-slate-900 bg-white">
            <History className="h-4 w-4 text-amber-700" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-black text-slate-500">歷年成績</span>
            <span className="block truncate text-sm font-black text-slate-900">
              {latestHistoricalScore
                ? `${latestHistoricalScore.year} 分數 ${latestHistoricalScore.points} / 積點 ${formatHistoricalCredits(latestHistoricalScore.credits)}`
                : '尚無歷年成績資料'}
            </span>
          </span>
        </span>
        <span className="text-xs font-black text-amber-700">查看</span>
      </button>

      <div className="relative z-10 mt-4 flex gap-2">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(school.name)}`}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-emerald-50 px-3 py-2.5 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
        >
          <MapPin className="h-4 w-4" />
          地圖
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <button
          type="button"
          onClick={onToggleCompare}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-900 px-3 py-2.5 text-sm font-black transition ${
            isCompared ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {isCompared ? <Check className="h-4 w-4" /> : <List className="h-4 w-4" />}
          {isCompared ? '已加入' : '加入比較'}
        </button>
      </div>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border-2 border-slate-200 bg-slate-50 p-3">
      <div className="text-[11px] font-black text-slate-500">{label}</div>
      <div className="mt-1 truncate text-sm font-black text-slate-900">{value}</div>
    </div>
  );
}
