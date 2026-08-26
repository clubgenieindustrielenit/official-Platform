"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X, Shield, Plus } from "lucide-react";

export interface PoleItem {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

interface MemberPoleMultiSelectProps {
  memberId: string;
  assignedPoleIds?: string[] | null;
  fallbackPoleId?: string | null;
  poles: PoleItem[];
  onChange: (newPoleIds: string[]) => void;
  disabled?: boolean;
}

export default function MemberPoleMultiSelect({
  memberId,
  assignedPoleIds,
  fallbackPoleId,
  poles,
  onChange,
  disabled = false,
}: MemberPoleMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize currently selected pole IDs
  const currentPoleIds: string[] = React.useMemo(() => {
    if (assignedPoleIds && assignedPoleIds.length > 0) {
      return assignedPoleIds;
    }
    if (fallbackPoleId) {
      return [fallbackPoleId];
    }
    return [];
  }, [assignedPoleIds, fallbackPoleId]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const togglePole = (poleId: string) => {
    let next: string[];
    if (currentPoleIds.includes(poleId)) {
      next = currentPoleIds.filter((id) => id !== poleId);
    } else {
      next = [...currentPoleIds, poleId];
    }
    onChange(next);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  // Helper for colors
  const getPoleColor = (poleName: string, fallbackColor?: string) => {
    if (fallbackColor) return fallbackColor;
    const name = poleName.toLowerCase();
    if (name.includes("partenariat") || name.includes("sponsoring")) return "#fca311";
    if (name.includes("logistique") || name.includes("événement") || name.includes("evenement")) return "#3b82f6";
    if (name.includes("projet")) return "#10b981";
    if (name.includes("formation")) return "#a855f7";
    return "#888888";
  };

  const selectedPoles = poles.filter((p) => currentPoleIds.includes(p.id));

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-[#121414] hover:bg-[#181a1a] border border-[#333535] focus:border-[#fca311] text-[11px] text-white rounded-xl px-2.5 py-1.5 outline-none cursor-pointer transition-colors max-w-[220px] text-left"
      >
        {selectedPoles.length === 0 ? (
          <span className="text-[#666] italic text-[10px] flex items-center gap-1">
            <Plus className="w-3 h-3 text-[#555]" />
            <span>Aucun pôle</span>
          </span>
        ) : (
          <div className="flex flex-wrap gap-1 items-center max-w-[170px] overflow-hidden">
            {selectedPoles.map((p) => {
              const color = getPoleColor(p.name, p.color);
              return (
                <span
                  key={p.id}
                  style={{
                    backgroundColor: `${color}18`,
                    borderColor: `${color}40`,
                    color: color,
                  }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border truncate"
                  title={p.name}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate max-w-[80px]">{p.name.replace(/^Pôle\s+/i, '')}</span>
                </span>
              );
            })}
          </div>
        )}
        <ChevronDown className="w-3 h-3 text-[#777] ml-auto shrink-0" />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 left-0 w-64 bg-[#181a1a] border border-[#333535] rounded-2xl shadow-2xl p-2.5 space-y-2 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between px-1 pb-1.5 border-b border-[#2a2c2c] text-[10px] text-[#888] font-mono uppercase tracking-wider">
            <span>Pôles Officiels</span>
            {currentPoleIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-red-400 hover:text-red-300 text-[10px] hover:underline cursor-pointer"
              >
                Effacer
              </button>
            )}
          </div>

          <div className="space-y-1 max-h-56 overflow-y-auto">
            {poles.map((p) => {
              const isSelected = currentPoleIds.includes(p.id);
              const color = getPoleColor(p.name, p.color);
              const displayName = p.name.replace(/^Pôle\s+/i, '');

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePole(p.id)}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white/10 text-white font-bold"
                      : "hover:bg-white/5 text-[#aaa] font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate text-[11px]">{displayName}</span>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-[#fca311] border-[#fca311] text-black"
                        : "border-[#444] bg-[#121414]"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-1.5 border-t border-[#2a2c2c] text-[9px] text-[#666] text-center font-mono">
            {currentPoleIds.length} pôle{currentPoleIds.length > 1 ? "s" : ""} assigné{currentPoleIds.length > 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
