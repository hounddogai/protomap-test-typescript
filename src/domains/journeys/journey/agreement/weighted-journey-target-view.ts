import { WeightedJourneyTarget } from "./weighted-journey-target.js";

/** How screens and exports show a weighted journey target. */
export class WeightedJourneyTargetView {
  code: string;
  label: string;
  version: string;
  endsAtText: string;
  notes: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    version: string,
    endsAtText: string,
    notes: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.endsAtText = endsAtText;
    this.notes = notes;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedJourneyTargetView(item: WeightedJourneyTarget): WeightedJourneyTargetView {
  return new WeightedJourneyTargetView(
    item.code,
    item.label,
    String(item.version),
    String(item.endsAt),
    item.notes,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedJourneyTargetViews(items: WeightedJourneyTarget[]): WeightedJourneyTargetView[] {
  const views: WeightedJourneyTargetView[] = [];
  for (const item of items) {
    views.push(toWeightedJourneyTargetView(item));
  }
  return views;
}

export function sumWeightedJourneyTargetView(view: WeightedJourneyTargetView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedVersion + parsedEndsAt + parsedCapacity;
}
