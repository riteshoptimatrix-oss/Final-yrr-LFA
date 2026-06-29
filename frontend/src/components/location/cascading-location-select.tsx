"use client";

import { useCallback, useMemo } from "react";
import { SearchableSelect } from "@components/ui/searchable-select";
import { cn } from "@utils/cn";
import { DEFAULT_STATE } from "@config/india-states";
import {
  getCitiesForState,
  getAreasForCity,
  getAllStates,
} from "@config/location-data";
import type {
  StateName,
  CityName,
  AreaName,
  SelectedLocation,
} from "@config/location-types";

// Props interface
interface CascadingLocationSelectProps {
  value?: SelectedLocation;
  onChange?: (location: SelectedLocation) => void;
  className?: string;
  disabled?: boolean;
  placeholderState?: string;
  placeholderCity?: string;
  placeholderArea?: string;
  required?: boolean;
}

// Empty state for initial render
const EMPTY_LOCATION: SelectedLocation = {
  state: null,
  city: null,
  area: null,
};

export function CascadingLocationSelect({
  value = EMPTY_LOCATION,
  onChange = () => {},
  className,
  disabled = false,
  placeholderState = "Select State",
  placeholderCity = "Select City",
  placeholderArea = "Select Area",
  required = false,
}: CascadingLocationSelectProps) {
  // Memoized options for performance
  const stateOptions = useMemo(() => getAllStates(), []);
  const cityOptions = useMemo(() => {
    if (value.state) {
      return getCitiesForState(value.state);
    }
    return [];
  }, [value.state]);
  const areaOptions = useMemo(() => {
    if (value.state && value.city) {
      return getAreasForCity(value.state, value.city);
    }
    return [];
  }, [value.state, value.city]);

  // Update city when state changes
  const handleStateChange = useCallback(
    (newState: StateName | undefined) => {
      if (!newState) {
        onChange({
          state: null,
          city: null,
          area: null,
        });
        return;
      }

      const cities = getCitiesForState(newState);
      const firstCity = cities[0] || null;

      onChange({
        state: newState,
        city: firstCity,
        area: null,
      });
    },
    [onChange]
  );

  // Update area when city changes
  const handleCityChange = useCallback(
    (newCity: CityName | undefined) => {
      if (!newCity) {
        onChange({
          state: value.state || DEFAULT_STATE,
          city: null,
          area: null,
        });
        return;
      }

      const areas = getAreasForCity(value.state || DEFAULT_STATE, newCity);
      const firstArea = areas[0] || null;

      onChange({
        state: value.state || DEFAULT_STATE,
        city: newCity,
        area: firstArea,
      });
    },
    [onChange, value.state]
  );

  // Handle area change
  const handleAreaChange = useCallback(
    (newArea: AreaName | undefined) => {
      onChange({
        state: value.state || DEFAULT_STATE,
        city: value.city || null,
        area: newArea || null,
      });
    },
    [onChange, value.state, value.city]
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* State Dropdown */}
      <div className="relative">
        <SearchableSelect
          value={value.state || ""}
          onValueChange={(val) => handleStateChange(val as StateName)}
          options={stateOptions}
          placeholder={placeholderState}
          disabled={disabled}
          searchPlaceholder="Search states..."
        />
        {required && (
          <span className="absolute -right-2 -top-2 h-2 w-2 rounded-full bg-destructive" />
        )}
      </div>

      {/* City Dropdown */}
      <div className="relative">
        <SearchableSelect
          value={value.city || ""}
          onValueChange={(val) => handleCityChange(val as CityName)}
          options={cityOptions}
          placeholder={placeholderCity}
          disabled={disabled || !value.state}
          emptyMessage="No cities available"
          searchPlaceholder="Search cities..."
        />
        {required && !value.city && (
          <span className="absolute -right-2 -top-2 h-2 w-2 rounded-full bg-destructive" />
        )}
      </div>

      {/* Area Dropdown */}
      <div className="relative">
        <SearchableSelect
          value={value.area || ""}
          onValueChange={(val) => handleAreaChange(val as AreaName)}
          options={areaOptions}
          placeholder={placeholderArea}
          disabled={disabled || !value.city}
          emptyMessage="No areas available"
          searchPlaceholder="Search areas..."
        />
        {required && !value.area && (
          <span className="absolute -right-2 -top-2 h-2 w-2 rounded-full bg-destructive" />
        )}
      </div>
    </div>
  );
}

// Convenience component for single select (just area)
export function AreaSelect({
  value,
  onChange,
  state,
  city,
  className,
  disabled = false,
  placeholder = "Select Area",
  required = false,
}: {
  value?: AreaName | null;
  onChange?: (area: AreaName | null) => void;
  state: StateName;
  city: CityName;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  const areaOptions = useMemo(() => {
    return getAreasForCity(state, city);
  }, [state, city]);

  return (
    <div className={cn("relative", className)}>
      <SearchableSelect
        value={value || ""}
        onValueChange={(val) => onChange?.(val as AreaName)}
        options={areaOptions}
        placeholder={placeholder}
        disabled={disabled}
        emptyMessage="No areas available"
        searchPlaceholder="Search areas..."
      />
      {required && !value && (
        <span className="absolute -right-2 -top-2 h-2 w-2 rounded-full bg-destructive" />
      )}
    </div>
  );
}

export default CascadingLocationSelect;
