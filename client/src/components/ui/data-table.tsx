import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";

interface DataTableProps<T> {
  data: T[];
  columns: {
    key: string;
    title: string;
    render?: (item: T) => React.ReactNode;
  }[];
  keyExtractor: (item: T) => string | number;
  searchField?: string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  pagination?: {
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchField,
  onRowClick,
  isLoading = false,
  pagination,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = searchField
    ? data.filter((item) => {
        const field = (item as any)[searchField] as string;
        if (typeof field === "string") {
          return field.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      })
    : data;

  return (
    <div className="w-full">
      {searchField && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="relative mb-2 sm:mb-0">
            <Input
              placeholder={`Search...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          </div>
          <Button variant="outline" size="sm" className="h-10">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.title}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow
                  key={keyExtractor(item)}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={onRowClick ? "cursor-pointer hover:bg-neutral-50" : ""}
                >
                  {columns.map((column) => (
                    <TableCell key={`${keyExtractor(item)}-${column.key}`}>
                      {column.render
                        ? column.render(item)
                        : (item as any)[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-neutral-500">
            Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{" "}
            {Math.min(
              pagination.currentPage * pagination.itemsPerPage,
              pagination.totalItems
            )}{" "}
            of {pagination.totalItems} entries
          </div>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
            >
              Previous
            </Button>
            {Array.from(
              {
                length: Math.ceil(
                  pagination.totalItems / pagination.itemsPerPage
                ),
              },
              (_, i) => i + 1
            )
              .filter(
                (page) =>
                  page === 1 ||
                  page === Math.ceil(pagination.totalItems / pagination.itemsPerPage) ||
                  Math.abs(page - pagination.currentPage) <= 1
              )
              .map((page, i, arr) => (
                <React.Fragment key={page}>
                  {i > 0 && arr[i - 1] !== page - 1 && (
                    <Button variant="outline" size="sm" disabled>
                      ...
                    </Button>
                  )}
                  <Button
                    variant={pagination.currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => pagination.onPageChange(page)}
                  >
                    {page}
                  </Button>
                </React.Fragment>
              ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={
                pagination.currentPage >=
                Math.ceil(pagination.totalItems / pagination.itemsPerPage)
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
