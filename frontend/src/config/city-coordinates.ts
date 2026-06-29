export interface CityCoord {
  lat: number;
  lng: number;
}

export const CITY_COORDS: Record<string, CityCoord> = {
  "Ahmedabad": { lat: 23.0225, lng: 72.5714 },
  "Surat": { lat: 21.1702, lng: 72.8311 },
  "Vadodara": { lat: 22.3072, lng: 73.1812 },
  "Rajkot": { lat: 22.3039, lng: 70.8022 },
  "Bhavnagar": { lat: 21.7645, lng: 72.1519 },
  "Jamnagar": { lat: 22.4707, lng: 70.0577 },
  "Junagadh": { lat: 21.5222, lng: 70.4579 },
  "Gandhinagar": { lat: 23.2156, lng: 72.6369 },
  "Anand": { lat: 22.5645, lng: 72.9289 },
  "Nadiad": { lat: 22.6939, lng: 72.8614 },
  "Morbi": { lat: 22.8141, lng: 70.8371 },
  "Surendranagar": { lat: 22.7271, lng: 71.6487 },
  "Bharuch": { lat: 21.7051, lng: 72.9959 },
  "Navsari": { lat: 20.9467, lng: 72.9320 },
  "Bhuj": { lat: 23.2420, lng: 69.6669 },
  "Amreli": { lat: 21.6032, lng: 71.2167 },
  "Patan": { lat: 23.8493, lng: 72.1266 },
  "Mehsana": { lat: 23.5880, lng: 72.3693 },
  "Palanpur": { lat: 24.1719, lng: 72.4383 },
  "Porbandar": { lat: 21.6417, lng: 69.6293 },
  "Gandhidham": { lat: 23.0753, lng: 70.1289 },
  "Veraval": { lat: 20.9158, lng: 70.3694 },
  "Valsad": { lat: 20.6068, lng: 72.9338 },
  "Modasa": { lat: 23.4626, lng: 73.2988 },
  "Godhra": { lat: 22.7788, lng: 73.6206 },
  "Himatnagar": { lat: 23.5989, lng: 72.9628 },
  "Dahod": { lat: 22.8345, lng: 74.2590 },
  "Botad": { lat: 22.1670, lng: 71.6650 },
  "Kutch": { lat: 23.7337, lng: 69.8597 },
  "Kheda": { lat: 22.7525, lng: 72.6842 },
  "Mahesana": { lat: 23.5880, lng: 72.3693 },
  "Sabarkantha": { lat: 23.5989, lng: 72.9628 },
  "Tapi": { lat: 21.1510, lng: 73.4260 },
  "Dang": { lat: 20.7587, lng: 73.6923 },
  "Narmada": { lat: 21.8773, lng: 73.7277 },
  "Panchmahal": { lat: 22.7788, lng: 73.6206 },
  "Chhota Udaipur": { lat: 22.3143, lng: 74.0658 },
  "Mahisagar": { lat: 23.0520, lng: 73.4180 },
  "Aravalli": { lat: 23.5989, lng: 72.9628 },
  "Banaskantha": { lat: 24.1719, lng: 72.4383 },
  "Gir Somnath": { lat: 20.9158, lng: 70.3694 },
  "Devbhoomi Dwarka": { lat: 22.2460, lng: 68.9674 },
};

export function getCityCoord(city: string): CityCoord | undefined {
  return CITY_COORDS[city];
}
