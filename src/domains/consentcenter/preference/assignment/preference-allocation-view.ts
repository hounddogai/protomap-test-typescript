import { PreferenceAllocation } from "./preference-allocation.js";

/** How screens and exports show a preference allocation. */
export class PreferenceAllocationView {
  code: string;
  name: string;
  region: string;
  updatedAtText: string;
  openRateText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    region: string,
    updatedAtText: string,
    openRateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.updatedAtText = updatedAtText;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceAllocationView(item: PreferenceAllocation): PreferenceAllocationView {
  return new PreferenceAllocationView(
    item.code,
    item.name,
    item.region,
    String(item.updatedAt),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceAllocationViews(items: PreferenceAllocation[]): PreferenceAllocationView[] {
  const views: PreferenceAllocationView[] = [];
  for (const item of items) {
    views.push(toPreferenceAllocationView(item));
  }
  return views;
}

export function sumPreferenceAllocationView(view: PreferenceAllocationView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedUpdatedAt + parsedOpenRate;
}
