import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from './card';
import { Input } from './input';
import { Button } from './button';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from '@/utils/helpers';

export interface Column<T = any> {
  key: string;
  header: string;
  sortable?: boolean;
  type?: 'date' | string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  emptyState?: React.ReactNode;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  showPagination?: boolean;
  rowProps?: (row: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>;
}

export function DataTable<T = any>({
  data,
  columns,
  onSort,
  sortKey,
  sortDirection,
  emptyState,
  className,
  searchable = false,
  searchPlaceholder = "Search...",
  pageSize = 10,
  showPagination = false,
  rowProps
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();
  const getSortIcon = (field: string) => {
      if (sortKey !== field) return <ArrowUpDown className="h-4 w-4" />;
      return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handleSort = (key: string, sortable?: boolean) => {
    if (sortable && onSort) {
      onSort(key);
    }
  };

  const renderCellContent = (column: Column<T>, row: T, index: number) => {
    const value = (row as any)[column.key];

    if (column.render) {
      return column.render(value, row, index);
    }

    if (column.type === 'date') {
      if (!value) return '-';
      return (
        <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{formatDate(value)}</span>
        </div>
      );
    }

    return value ?? '-';
  };

  const filteredData = useMemo(() => {
    // Ensure data is always an array
    const safeData = Array.isArray(data) ? data : [];
    if (!searchable || !searchTerm) return safeData;
    return safeData.filter((row: any) => 
      columns.some(column => {
        const value = row[column.key];
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns, searchable]);

  const paginatedData = useMemo(() => {
    if (!showPagination) return filteredData;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize, showPagination]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Card className={className}>
      {searchable && (
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="w-full border-0">
        <table
          className="w-full min-w-full caption-bottom text-sm"
          style={{ minWidth: isMobile ? Math.max(560, columns.length * 140) : '100%' }}
        >
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "font-bold bg-gray-100 dark:bg-gray-800 dark:text-gray-200",
                    column.sortable ? 'cursor-pointer' : '',
                    column.className || ''
                  )}
                  onClick={() => handleSort(column.key, column.sortable)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => (
                <TableRow
                  key={(row as any).id || index}
                  {...(rowProps ? rowProps(row, index) : {})}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {renderCellContent(column, row, index)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyState || (
                    <div className="flex flex-col items-center justify-center text-center">
                      <p className="text-muted-foreground">
                        {searchTerm ? 'No results found' : 'No data available'}
                      </p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </table>
        </div>
      </CardContent>
      {showPagination && totalPages > 1 && (
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground sm:text-sm">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} results
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 sm:px-3"
              >
                <ChevronLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page =>
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span key={`ellipsis-${page}`} className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  ))
                }
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4 sm:ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}