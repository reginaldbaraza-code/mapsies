import type { Place } from "../../types";

export function createStationChip(
  label: string,
  onPick: () => void,
  accent = false
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `station-chip${accent ? " station-chip--accent" : ""}`;
  btn.textContent = label;
  btn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    onPick();
  });
  return btn;
}

export function renderStationChips(
  container: HTMLElement,
  items: { label: string; place?: Place; accent?: boolean }[],
  onPick: (place: Place | null, label: string) => void
): void {
  container.innerHTML = "";
  container.hidden = items.length === 0;
  items.forEach((item) => {
    const chip = createStationChip(item.label, () => onPick(item.place ?? null, item.label), item.accent);
    container.appendChild(chip);
  });
}

export function renderSuggestList(
  list: HTMLElement,
  places: Place[],
  onPick: (p: Place) => void
): void {
  list.innerHTML = "";
  list.hidden = places.length === 0;
  places.forEach((place) => {
    const li = document.createElement("li");
    li.setAttribute("role", "option");
    li.textContent = place.label;
    li.addEventListener("mousedown", (e) => {
      e.preventDefault();
      onPick(place);
    });
    list.appendChild(li);
  });
}

export function chipLabelFromPlace(place: Place): string {
  return place.label.split(",")[0] ?? place.label;
}
