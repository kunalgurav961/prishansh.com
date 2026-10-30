
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

const getPageItems = (page, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const middleStart = Math.max(2, page - 1);
  const middleEnd = Math.min(totalPages - 1, page + 1);
  const items = [1];

  if (middleStart > 2) items.push("start-ellipsis");
  for (let current = middleStart; current <= middleEnd; current += 1) {
    items.push(current);
  }
  if (middleEnd < totalPages - 1) items.push("end-ellipsis");

  items.push(totalPages);
  return items;
};

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pageItems = getPageItems(page, totalPages);

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:justify-between"
      aria-label="Product pagination"
    >
      <p className="order-2 w-full text-center text-xs text-neutral-500 sm:order-1 sm:w-auto sm:text-left">
        Page {page} of {totalPages}
      </p>

      <div className="order-1 flex items-center gap-1 sm:order-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition-colors hover:border-[#5433eb] hover:text-[#5433eb] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronLeft size={17} aria-hidden="true" />
        </button>

        {pageItems.map((item) =>
          typeof item === "number" ? (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
              aria-label={`Page ${item}`}
              className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-xs font-semibold transition-colors ${
                item === page
                  ? "bg-[#5433eb] text-white shadow-[0_4px_18px_rgba(69,36,219,0.24)]"
                  : "border border-neutral-200 bg-white text-neutral-700 hover:border-[#5433eb] hover:text-[#5433eb]"
              }`}
            >
              {item}
            </button>
          ) : (
            <span
              key={item}
              className="flex h-10 w-7 items-center justify-center text-neutral-400"
              aria-hidden="true"
            >
              <MoreHorizontal size={17} />
            </span>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition-colors hover:border-[#5433eb] hover:text-[#5433eb] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronRight size={17} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
