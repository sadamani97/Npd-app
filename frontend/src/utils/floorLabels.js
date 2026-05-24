/** Floor key for URLs and grouping (matches DB / inferFloorNumber). */
export function normalizeFloorKey(floor) {
  const s = String(floor ?? "").trim();
  return s || "1";
}

/**
 * Sort floor keys numerically when possible, else lexicographically.
 */
export function compareFloorKeys(a, b) {
  const na = Number.parseInt(String(a), 10);
  const nb = Number.parseInt(String(b), 10);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

/**
 * Assign friendly labels in order: Ground, First, Second; then "Floor {key}" for any extra floors.
 */
export function labelFloors(uniqueFloorKeys) {
  const sorted = [...uniqueFloorKeys].sort(compareFloorKeys);
  const primary = ["Ground Floor", "First Floor", "Second Floor"];
  return sorted.map((key, idx) => ({
    floorKey: key,
    label: primary[idx] || `Floor ${key}`
  }));
}
