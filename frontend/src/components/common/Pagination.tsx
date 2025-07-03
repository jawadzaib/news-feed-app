import React from "react";
import { PaginatedResponse } from "@/types/api";

interface PaginationProps {
  paginationMeta: PaginatedResponse<any> | null;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  paginationMeta,
  onPageChange,
}) => {
  if (!paginationMeta || paginationMeta.last_page <= 1) return null;

  return (
    <div className="flex flex-wrap justify-center mt-4 gap-2 sm:gap-3">
      {paginationMeta.links.map((link, index) => (
        <button
          key={index}
          onClick={() =>
            link.url &&
            onPageChange(Number(new URL(link.url).searchParams.get("page")))
          }
          className={`px-3 py-1 sm:px-4 sm:py-2
          rounded-md
          text-sm font-medium
          transition duration-150 ease-in-out ${
            link.active
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={!link.url}
          dangerouslySetInnerHTML={{ __html: link.label }}
        />
      ))}
    </div>
  );
};

export default Pagination;
