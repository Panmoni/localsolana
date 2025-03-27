import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyOptions } from "@/lib/currencyOptions";

interface FilterBarProps {
  onCurrencyChange: (currency: string) => void;
}

const FilterBar = ({ onCurrencyChange }: FilterBarProps) => {
  const [currency, setCurrency] = useState<string>("ALL");

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    onCurrencyChange(value);
  };

  return (
    <div className="flex flex-wrap justify-end items-center gap-3">
      <div className="text-neutral-700 font-thin text-xs sm:text-sm">
        Filter offers
      </div>
      <div className="w-auto">
        <Select value={currency} onValueChange={handleCurrencyChange}>
          <SelectTrigger className="w-full sm:w-[200px] border-neutral-300 focus:ring-[#8b5cf6]">
            <SelectValue placeholder="Filter by currency" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-100">
            <SelectItem value="ALL">All Currencies</SelectItem>
            <CurrencyOptions />
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FilterBar;
