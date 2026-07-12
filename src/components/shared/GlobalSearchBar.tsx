"use client";

import React, { useState, useEffect, useTransition, useRef } from "react";
import { searchGlobalAction, SearchResultItem } from "@/actions/search.actions";
import { Search, Loader2, X, Truck, User, Route, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";

export function GlobalSearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Monitor keyboard shortcuts (Ctrl + K or Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Autofocus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Handle typing search query
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await searchGlobalAction(query);
          if (res.success && res.results) {
            setResults(res.results);
          }
        } catch (err) {
          console.error(err);
        }
      });
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const selectResult = (link: string) => {
    setIsOpen(false);
    router.push(link);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "vehicle":
        return <Truck className="w-4 h-4 text-indigo-500" />;
      case "driver":
        return <User className="w-4 h-4 text-emerald-500" />;
      case "trip":
        return <Route className="w-4 h-4 text-amber-500" />;
      default:
        return <Wrench className="w-4 h-4 text-rose-500" />;
    }
  };

  return (
    <>
      {/* Click Trigger Bar in top navigation */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-72 h-[38px] px-3 bg-gray-100 hover:bg-gray-150 border border-gray-200 rounded-input flex items-center justify-between text-left text-xs font-semibold text-gray-500 transition-colors shadow-inner shrink-0"
      >
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <span>Search fleet registry...</span>
        </div>
        <kbd className="hidden md:inline-block px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono text-gray-400 uppercase tracking-wide">
          Ctrl + K
        </kbd>
      </button>

      {/* Full screen backdrop modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Modal content body */}
          <div className="relative w-full max-w-xl bg-white border border-gray-200 rounded-modal shadow-large overflow-hidden animate-in fade-in slide-in-from-top-10 duration-150 flex flex-col max-h-[450px]">
            {/* Header Query Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type plate, driver name, route destination..."
                className="flex-1 bg-transparent border-0 text-sm text-gray-900 focus:outline-none placeholder-gray-400"
              />
              {isPending && <Loader2 className="w-4 h-4 text-primary-500 animate-spin shrink-0" />}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Results output list */}
            <div className="flex-1 overflow-y-auto p-2">
              {results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectResult(item.link)}
                      className="w-full text-left px-3 py-2.5 rounded-input hover:bg-gray-50 flex items-center gap-3.5 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors shadow-small">
                        {getIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate uppercase tracking-wider">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : query.trim().length >= 2 ? (
                <div className="py-8 text-center text-gray-400 text-sm font-medium">
                  No matching fleet records found.
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400 text-xs font-medium uppercase tracking-wide">
                  Type at least 2 characters to search registry.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
