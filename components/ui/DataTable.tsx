"use client";

import React from "react";
import { motion } from "framer-motion";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export default function DataTable<T extends { id: string | number }>({
  columns,
  data,
  emptyMessage = "Aucune donnée disponible",
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto touch-scroll rounded-2xl border border-[#333535] bg-[#14213d]/40 backdrop-blur-md">
      <table className="w-full text-left text-sm border-collapse min-w-[600px]">
        <thead>
          <tr className="bg-[#282a2b] border-b border-[#333535] text-[#e2e2e2]">
            {columns.map((col, idx) => (
              <th key={idx} className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2a2c2c]">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-[#777] text-sm italic"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: rowIdx * 0.04 }}
                className="bg-[#1e2020] hover:bg-[#252828] transition-colors border-l-2 border-l-transparent hover:border-l-custom-amber group"
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-6 py-4 text-[#e2e2e2] text-sm">
                    {col.cell ? col.cell(row) : (row[col.accessorKey as keyof T] as React.ReactNode)}
                  </td>
                ))}
              </motion.tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
