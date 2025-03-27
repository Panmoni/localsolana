import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyOptions } from "@/lib/currencyOptions";

interface FilterBarProps {
  onCurrencyChange: (currency: string) => void;
  onTradeTypeChange?: (tradeType: string) => void;
}

const FilterBar = ({ onCurrencyChange, onTradeTypeChange }: FilterBarProps) => {
  const [currency, setCurrency] = useState<string>("ALL");
  const [tradeType, setTradeType] = useState<string>("ALL");

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    onCurrencyChange(value);
  };

  const handleTradeTypeChange = (value: string) => {
    setTradeType(value);
    if (onTradeTypeChange) {
      onTradeTypeChange(value);
    }
  };

  return (
    <div className="flex flex-wrap justify-end items-center gap-3">
      <div className="text-neutral-700 font-thin text-xs sm:text-sm">
        Filter offers
      </div>
      <div className="w-auto">
        <Select value={tradeType} onValueChange={handleTradeTypeChange}>
          <SelectTrigger className="w-full sm:w-[200px] border-neutral-300 focus:ring-[#8b5cf6]">
            <SelectValue placeholder="I want to..." />
          </SelectTrigger>
          <SelectContent className="bg-neutral-100">
            <SelectItem value="ALL">All offers</SelectItem>
            <SelectItem value="BUY">I am buying USDC</SelectItem>
            <SelectItem value="SELL">I am selling USDC</SelectItem>
          </SelectContent>
        </Select>
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
