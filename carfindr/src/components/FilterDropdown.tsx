"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils"; // Adjust path if needed
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Define the structure for dropdown options
export type FilterOption = {
  value: string; // The internal value (e.g., ID, code)
  label: string; // The value displayed to the user
};

type FilterDropdownProps = {
  label: string; // Label above the dropdown
  triggerLabel: string; // Placeholder text when nothing is selected
  selectedValue: string | null; // The currently selected value (e.g., brandId, yearFrom)
  options: FilterOption[]; // List of available options
  onSelect: (value: string | null) => void; // Callback when an option is selected
  searchPlaceholder?: string; // Placeholder for the search input
  allowClear?: boolean; // Whether to show a "Clear" or "All" option
  clearLabel?: string; // Label for the clear/all option (defaults to "All")
  disabled?: boolean; // Disable the dropdown trigger
  popoverContentClassName?: string; // Optional class for PopoverContent
};

export function FilterDropdown({
  label,
  triggerLabel,
  selectedValue,
  options,
  onSelect,
  searchPlaceholder = "Buscar...",
  allowClear = false,
  clearLabel = "Todos",
  disabled = false,
  popoverContentClassName = "max-h-64 w-[--radix-popover-trigger-width] overflow-auto rounded-xl border-white/70 bg-white/95 p-0 shadow-xl shadow-slate-900/10",
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);

  // Find the label corresponding to the selected value for display on the button
  const displayLabel = options.find((opt) => opt.value === selectedValue)?.label ??
                       (allowClear && selectedValue === null ? clearLabel : triggerLabel);

  const handleSelect = (newValue: string | null) => {
    onSelect(newValue);
    setOpen(false);
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor={`filter-${label}`}>
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={`filter-${label}`}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-11 w-full justify-between rounded-xl border-slate-300/80 bg-white/80 text-slate-700 shadow-sm hover:bg-slate-50"
            disabled={disabled}
          >
            {/* Use the found label or the appropriate placeholder */}
            {displayLabel}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("p-0", popoverContentClassName)}>
          <Command>
            {searchPlaceholder && <CommandInput placeholder={searchPlaceholder} />}
            <CommandList className="max-h-56 overflow-auto">
              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
              <CommandGroup>
                {/* Optional "Clear" / "All" option */}
                {allowClear && (
                  <CommandItem
                    value="" // Represents the "clear" state
                    onSelect={() => handleSelect(null)} // Pass null for clear
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedValue === null ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {clearLabel}
                  </CommandItem>
                )}
                {/* Map through provided options */}
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label} // Use label for searching within CommandInput
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedValue === option.value
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
