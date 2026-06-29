"use client";

import { useState, useRef, useEffect, useCallback, useMemo, memo, type KeyboardEvent } from "react";
import { ChevronDown, Search, X, Loader2, Check } from "lucide-react";
import { cn } from "@utils/cn";
import {
  getAllCountries,
  getStatesOfCountry,
  getCitiesOfState,
  getCitiesOfCountry,
  searchAreas,
  cancelAreaSearch,
} from "@/services/geography.service";
import type {
  GeographyCountry,
  GeographyState,
  GeographyCity,
  GeographyArea,
} from "@/types/geography";

export interface LocationSelection {
  country: GeographyCountry | null;
  state: GeographyState | null;
  city: GeographyCity | null;
  area: GeographyArea | null;
}

interface DropdownProps<T> {
  items: T[];
  value: T | null | undefined;
  onChange: (item: T | null) => void;
  placeholder: string;
  searchPlaceholder: string;
  disabled: boolean;
  loading: boolean;
  renderLabel: (item: T) => string;
  renderItem?: (item: T) => React.ReactNode;
  getKey: (item: T) => string;
  selectId: string;
  onSearchChange?: (query: string) => void;
  noOptionsMessage?: string;
  minSearchChars?: number;
}

function DropdownInner<T>({
  items,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  disabled,
  loading,
  renderLabel,
  renderItem,
  getKey,
  selectId,
  onSearchChange,
  noOptionsMessage,
  minSearchChars,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchChangeRef = useRef(onSearchChange);
  searchChangeRef.current = onSearchChange;

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(item => renderLabel(item).toLowerCase().includes(q));
  }, [items, search, renderLabel]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSearch("");
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Tab") {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);

    requestAnimationFrame(() => searchInputRef.current?.focus());

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, handleClose]);

  useEffect(() => {
    if (open) setActiveIndex(-1);
  }, [search, open]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    searchChangeRef.current?.(value);
  }, []);

  const handleSelect = useCallback((item: T) => {
    onChange(item);
    handleClose();
  }, [onChange, handleClose]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  }, [onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : filtered.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filtered.length) {
          handleSelect(filtered[activeIndex]);
        }
        break;
      case "Escape":
      case "Tab":
        handleClose();
        break;
    }
  }, [filtered, activeIndex, handleSelect, handleClose]);

  const triggerKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      if (!disabled) setOpen(true);
    }
  }, [disabled]);

  const activeDescendant = open && activeIndex >= 0 && filtered[activeIndex]
    ? `${selectId}-option-${getKey(filtered[activeIndex])}`
    : undefined;

  const skeletonWidths = ["60%", "80%", "75%", "90%", "65%"];

  const showSearch = onSearchChange || items.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? `${selectId}-listbox` : undefined}
        aria-activedescendant={activeDescendant}
        aria-label={placeholder}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={disabled ? undefined : triggerKeyDown}
        onClick={() => { if (!disabled) setOpen(!open); }}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition-colors",
          open && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {value ? renderLabel(value) : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && !disabled && (
            <button
              onClick={handleClear}
              className="rounded-sm opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Clear selection"
              tabIndex={-1}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", open && "rotate-180")} />
          )}
        </div>
      </div>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full min-w-[14rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {showSearch && (
            <div className="flex items-center border-b border-border px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                aria-label={searchPlaceholder}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="shrink-0 rounded-sm opacity-50 hover:opacity-100 transition-opacity"
                  tabIndex={-1}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {loading && items.length === 0 ? (
            <div className="p-2 space-y-2">
              {skeletonWidths.map((width, i) => (
                <div
                  key={i}
                  className="h-4 rounded-md bg-muted animate-pulse"
                  style={{ width }}
                />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <ul
              ref={listRef}
              id={`${selectId}-listbox`}
              role="listbox"
              aria-label={placeholder}
              className="max-h-60 overflow-auto p-1"
            >
              {filtered.map((item, index) => {
                const key = getKey(item);
                const isSelected = !!(value && getKey(value) === key);
                return (
                  <li
                    key={key}
                    id={`${selectId}-option-${key}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
                      activeIndex === index && "bg-accent text-accent-foreground",
                      isSelected && "font-medium"
                    )}
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      {isSelected && <Check className="h-4 w-4" />}
                    </span>
                    {renderItem ? renderItem(item) : <span className="truncate">{renderLabel(item)}</span>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {loading
                ? "Searching..."
                : items.length === 0 && !search
                ? (noOptionsMessage || "No options available")
                : minSearchChars && search.length < minSearchChars
                ? `Type at least ${minSearchChars} characters`
                : items.length === 0
                ? (noOptionsMessage || "No results found")
                : "No results found"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const Dropdown = memo(DropdownInner) as typeof DropdownInner;

function getFlagEmoji(iso2: string): string {
  const codePoints = iso2.toUpperCase().split("").map(char => 0x1F1E6 + char.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

function formatCountryLabel(country: GeographyCountry): string {
  return `${getFlagEmoji(country.iso2)} ${country.name}`;
}

interface LocationSelectorProps {
  value?: Partial<LocationSelection>;
  onChange: (selection: LocationSelection) => void;
  showCountry?: boolean;
  showState?: boolean;
  showCity?: boolean;
  showArea?: boolean;
  className?: string;
  disabled?: boolean;
}

const EMPTY_SELECTION: LocationSelection = {
  country: null,
  state: null,
  city: null,
  area: null,
};

export function LocationSelector({
  value = EMPTY_SELECTION,
  onChange,
  showCountry = true,
  showState = true,
  showCity = true,
  showArea = false,
  className,
  disabled = false,
}: LocationSelectorProps) {
  const countries = useMemo(() => getAllCountries(), []);

  const [internalStates, setInternalStates] = useState<GeographyState[]>([]);
  const [internalCities, setInternalCities] = useState<GeographyCity[]>([]);
  const [internalAreas, setInternalAreas] = useState<GeographyArea[]>([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [areasError, setAreasError] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCountryRef = useRef(value.country);
  const prevStateRef = useRef(value.state);
  const prevCityRef = useRef(value.city);

  const countryHasStates = internalStates.length > 0;
  const canSelectCity = !!value.country && (!countryHasStates || !!value.state);

  const onCountryChange = useCallback((country: GeographyCountry | null) => {
    console.log(`[LocationSelector] Country changed:`, country?.name || 'null', `ISO: ${country?.iso2 || 'N/A'}`);

    const states = country ? getStatesOfCountry(country.iso2) : [];
    console.log(`[LocationSelector] States loaded: ${states.length} for country ${country?.name || 'none'} (ISO: ${country?.iso2 || 'N/A'})`);
    if (country && states.length === 0) {
      console.warn(`[LocationSelector] WARNING: No states found for country: ${country.name} (ISO: ${country.iso2})`);
    }

    setInternalStates(states);
    const cities = country && states.length === 0
      ? getCitiesOfCountry(country.iso2)
      : [];
    setInternalCities(cities);
    setInternalAreas([]);

    onChange({
      country,
      state: null,
      city: null,
      area: null,
    });
  }, [onChange]);

  const onStateChange = useCallback((state: GeographyState | null) => {
    console.log(`[LocationSelector] State changed:`, state?.name || 'null', `ISO: ${state?.isoCode || 'N/A'}`);

    const countryIso2 = value.country?.iso2 || (state ? state.countryCode : '');
    const cities = state ? getCitiesOfState(countryIso2, state.isoCode) : [];
    console.log(`[LocationSelector] Cities loaded: ${cities.length} for state ${state?.name || 'none'} (countryISO: ${countryIso2}, stateISO: ${state?.isoCode || 'N/A'})`);

    setInternalCities(cities);
    setInternalAreas([]);

    onChange({
      country: value.country ?? null,
      state: state ?? null,
      city: null,
      area: null,
    });
  }, [onChange, value.country]);

  const onCityChange = useCallback((city: GeographyCity | null) => {
    console.log(`[LocationSelector] City changed:`, city?.name || 'null');
    setInternalAreas([]);
    onChange({
      country: value.country ?? null,
      state: value.state ?? null,
      city: city ?? null,
      area: null,
    });
  }, [onChange, value.country, value.state]);

  const onAreaChange = useCallback((area: GeographyArea | null) => {
    onChange({
      country: value.country ?? null,
      state: value.state ?? null,
      city: value.city ?? null,
      area: area ?? null,
    });
  }, [onChange, value.country, value.state, value.city]);

  const handleAreaSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query || query.trim().length < 3 || !value.country || !value.city) {
      if (!query) {
        setInternalAreas([]);
        setAreasLoading(false);
        setAreasError(false);
      }
      return;
    }

    setAreasLoading(true);
    setAreasError(false);

    debounceRef.current = setTimeout(async () => {
      try {
        const countryIso2 = value.country!.iso2;
        console.log(`[LocationSelector] Searching areas: "${query}" in ${value.city!.name}, ${value.state?.name || value.country!.name}, ${value.country!.name} (ISO: ${countryIso2})`);
        const results = await searchAreas(
          query,
          value.country!.name,
          value.state?.name || '',
          value.city!.name,
          countryIso2
        );
        console.log(`[LocationSelector] Areas found: ${results.length}`);
        setInternalAreas(results);
        setAreasError(results.length === 0);
      } catch (err) {
        console.error(`[LocationSelector] Area search failed:`, err);
        setAreasError(true);
        setInternalAreas([]);
      } finally {
        setAreasLoading(false);
      }
    }, 400);
  }, [value.country, value.state, value.city]);

  useEffect(() => {
    if (value.country !== prevCountryRef.current) {
      prevCountryRef.current = value.country;
      const states = value.country ? getStatesOfCountry(value.country.iso2) : [];
      console.log(`[LocationSelector][Effect] States synced: ${states.length} for ${value.country?.name || 'none'} (ISO: ${value.country?.iso2 || 'N/A'})`);
      setInternalStates(states);
      if (!value.country) {
        setInternalCities([]);
        setInternalAreas([]);
      }
    }
  }, [value.country]);

  useEffect(() => {
    if (value.state !== prevStateRef.current) {
      prevStateRef.current = value.state;
      console.log(`[LocationSelector][Effect] State sync triggered for: ${value.state?.name || 'none'}`);
    }
  }, [value.state]);

  useEffect(() => {
    if (value.city !== prevCityRef.current) {
      prevCityRef.current = value.city;
      console.log(`[LocationSelector][Effect] City sync triggered for: ${value.city?.name || 'none'}`);
    }
  }, [value.city]);

  useEffect(() => {
    if (!value.country) {
      setInternalCities([]);
      return;
    }
    if (internalStates.length === 0) {
      const cities = getCitiesOfCountry(value.country.iso2);
      setInternalCities(cities);
      return;
    }
    if (!value.state) {
      setInternalCities([]);
      return;
    }
    const cities = getCitiesOfState(value.country.iso2, value.state.isoCode);
    console.log(`[LocationSelector][Effect] Cities synced: ${cities.length} for ${value.state.name} (countryISO: ${value.country.iso2}, stateISO: ${value.state.isoCode})`);
    setInternalCities(cities);
  }, [value.country, value.state, internalStates.length]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      cancelAreaSearch();
    };
  }, []);

  const areaSearchPlaceholder = !value.country || !value.city
    ? countryHasStates && !value.state
      ? "Select country, state, and city first"
      : "Select country and city first"
    : "Search specific area (Optional)";

  console.log(`[LocationSelector] Render: country=${value.country?.name || 'none'}, states=${internalStates.length}, cities=${internalCities.length}, areas=${internalAreas.length}`);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {showCountry && (
        <Dropdown<GeographyCountry>
          selectId="country"
          items={countries}
          value={value.country}
          onChange={onCountryChange}
          placeholder="Select Country"
          searchPlaceholder="Search countries..."
          disabled={disabled}
          loading={false}
          getKey={item => item._id}
          renderLabel={item => formatCountryLabel(item)}
          renderItem={item => (
            <span className="truncate">{formatCountryLabel(item)}</span>
          )}
        />
      )}

      {showState && countryHasStates && (
        <Dropdown<GeographyState>
          selectId="state"
          items={internalStates}
          value={value.state}
          onChange={onStateChange}
          placeholder="Select State / Province"
          searchPlaceholder="Search states..."
          disabled={disabled || !value.country}
          loading={false}
          getKey={item => item._id}
          renderLabel={item => item.name}
        />
      )}

      {showCity && (
        <Dropdown<GeographyCity>
          selectId="city"
          items={internalCities}
          value={value.city}
          onChange={onCityChange}
          placeholder="Select City"
          searchPlaceholder="Search cities..."
          disabled={disabled || !canSelectCity}
          loading={false}
          getKey={item => item._id}
          renderLabel={item => item.name}
        />
      )}

      {showArea && (
        <Dropdown<GeographyArea>
          selectId="area"
          items={internalAreas}
          value={value.area}
          onChange={onAreaChange}
          placeholder={areaSearchPlaceholder}
          searchPlaceholder="Search areas (min 3 chars)..."
          disabled={disabled || !value.city}
          loading={areasLoading}
          getKey={item => item._id}
          renderLabel={item => item.areaName}
          renderItem={item => (
            <div className="flex flex-col">
              <span className="truncate font-medium">{item.areaName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {[item.city, item.state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          onSearchChange={handleAreaSearch}
          noOptionsMessage={areasError ? "No matching areas found" : "Type at least 3 characters to search"}
          minSearchChars={3}
        />
      )}
    </div>
  );
}

export default LocationSelector;
