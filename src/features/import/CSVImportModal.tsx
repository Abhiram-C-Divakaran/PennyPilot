import React, { useState } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ArrowRight,
  Loader2,
  RefreshCw,
  Layers
} from "lucide-react";
import { CSVColumnMapping, CSVImportPreview, CSVImportResult, IncomingTransaction } from "../../types/ingestion";
import { getCSVPreview, importCSVTransactions } from "../../api/ingestion";
import { formatCurrency } from "../../utils/currency";

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => Promise<void>;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [step, setStep] = useState<"upload" | "preview" | "summary">("upload");
  const [csvContent, setCsvContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<CSVImportPreview | null>(null);
  const [summary, setSummary] = useState<CSVImportResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      setCsvContent(text);
      await generatePreview(text);
    };
    reader.readAsText(file);
  };

  // Sample CSV template loader
  const handleLoadSampleCSV = async () => {
    const sample = `Date,Description,Debit,Credit,Ref
11/10/2026,ZOMATO ONLINE,450.00,,UPI-987654
10/10/2026,UBER TRIP MUMBAI,320.00,,UPI-123456
09/10/2026,SALARY CREDIT,,30000.00,NEFT-SAL-OCT
08/10/2026,UNKNOWN LOCAL CORNER STORE,780.00,,POS-998877
08/10/2026,AMAZON INDIA,1499.00,,AMZ-OCT-88`;
    setFileName("sample_bank_statement.csv");
    setCsvContent(sample);
    await generatePreview(sample);
  };

  const generatePreview = async (content: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getCSVPreview(content);
      setPreview(res);
      setStep("preview");
    } catch (err: any) {
      setError(err?.message || "Failed to parse CSV file");
    } finally {
      setIsLoading(false);
    }
  };

  // Execute import of ready & review transactions (excluding exact duplicates)
  const handleExecuteImport = async () => {
    if (!preview) return;

    // Filter out duplicates so user imports only valid new rows
    const toImport: IncomingTransaction[] = preview.items
      .filter((item) => item.status !== "duplicate")
      .map((item) => item.incoming);

    if (toImport.length === 0) {
      setError("No valid or non-duplicate transactions found to import.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await importCSVTransactions(toImport);
      setSummary(res);
      setStep("summary");
      await onImportComplete();
    } catch (err: any) {
      setError(err?.message || "Failed to import transactions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setCsvContent("");
    setFileName("");
    setPreview(null);
    setSummary(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Import Bank Statement (CSV)</h2>
              <p className="text-xs text-zinc-400">Automated ingestion & deduplication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === "upload" && (
            <div className="space-y-4 text-center py-2">
              <div className="border-2 border-dashed border-zinc-700/80 hover:border-emerald-500/60 rounded-2xl p-6 transition-all bg-zinc-950/40">
                <Upload className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-zinc-200">Upload bank statement CSV</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                  Supports standard bank exports with Date, Narration/Description, Debit, Credit, or Amount.
                </p>

                <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <label className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-zinc-950 font-bold text-xs shadow-md cursor-pointer transition-all">
                    Choose File
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleLoadSampleCSV}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Load Sample Statement
                  </button>
                </div>
              </div>

              {isLoading && (
                <div className="py-4 flex items-center justify-center gap-2 text-xs text-zinc-400">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Parsing and scanning transactions...</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PREVIEW */}
          {step === "preview" && preview && (
            <div className="space-y-4">
              {/* Summary Stats Banner */}
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Ready</span>
                  <span className="text-base font-extrabold text-emerald-400">{preview.readyCount}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Needs Review</span>
                  <span className="text-base font-extrabold text-amber-400">{preview.reviewCount}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Duplicates</span>
                  <span className="text-base font-extrabold text-zinc-400">{preview.duplicateCount}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
                  Preview ({preview.items.length} transactions)
                </span>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {preview.items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                        item.status === "duplicate"
                          ? "bg-zinc-950/40 border-zinc-800/60 opacity-60"
                          : item.status === "pending_review"
                          ? "bg-amber-950/20 border-amber-500/30"
                          : "bg-zinc-900 border-zinc-800"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold text-zinc-200 block truncate">
                          {item.incoming.merchant || item.incoming.rawDescription}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                          <span>{item.incoming.timestamp?.split("T")[0]}</span>
                          {item.categorization.suggestedCategoryName && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400">{item.categorization.suggestedCategoryName}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-zinc-100 block">
                          {formatCurrency(item.incoming.amount)}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-0.5 ${
                            item.status === "duplicate"
                              ? "bg-zinc-800 text-zinc-400"
                              : item.status === "pending_review"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {item.status === "duplicate"
                            ? "Duplicate"
                            : item.status === "pending_review"
                            ? "Review"
                            : "Auto-Confirm"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isLoading || preview.readyCount + preview.reviewCount === 0}
                  onClick={handleExecuteImport}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-zinc-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <span>
                      Import {preview.readyCount + preview.reviewCount} Transactions
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUMMARY */}
          {step === "summary" && summary && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Import Complete!</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Transactions have passed through the ingestion and deduplication pipeline.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 grid grid-cols-2 gap-3 text-left text-xs max-w-xs mx-auto">
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold block">Auto-Confirmed:</span>
                  <span className="text-sm font-bold text-emerald-400">{summary.createdCount}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold block">Needs Review:</span>
                  <span className="text-sm font-bold text-amber-400">{summary.reviewCount}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold block">Duplicates Skipped:</span>
                  <span className="text-sm font-bold text-zinc-400">{summary.duplicateCount}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold block">Errors / Rejected:</span>
                  <span className="text-sm font-bold text-zinc-400">{summary.errorCount}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
