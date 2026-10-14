import { AdaptiveTierAllocation } from "./adaptive-tier-allocation.js";

/** How screens and exports show a adaptive tier allocation. */
export class AdaptiveTierAllocationView {
  code: string;
  name: string;
  activeText: string;
  archived: string;
  startsAt: string;
  limit: string;
  impressionsText: string;
  ceiling: string;
  campaignRef: string;
  ratio: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    activeText: string,
    archived: string,
    startsAt: string,
    limit: string,
    impressionsText: string,
    ceiling: string,
    campaignRef: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.activeText = activeText;
    this.archived = archived;
    this.startsAt = startsAt;
    this.limit = limit;
    this.impressionsText = impressionsText;
    this.ceiling = ceiling;
    this.campaignRef = campaignRef;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveTierAllocationView(item: AdaptiveTierAllocation): AdaptiveTierAllocationView {
  return new AdaptiveTierAllocationView(
    item.code,
    item.name,
    `${item.active}`,
    `${item.archived}`,
    String(item.startsAt),
    String(item.limit),
    String(item.impressions),
    item.ceiling.toFixed(2),
    item.campaignRef,
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveTierAllocationViews(items: AdaptiveTierAllocation[]): AdaptiveTierAllocationView[] {
  const views: AdaptiveTierAllocationView[] = [];
  for (const item of items) {
    views.push(toAdaptiveTierAllocationView(item));
  }
  return views;
}

export function sumAdaptiveTierAllocationView(view: AdaptiveTierAllocationView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedStartsAt + parsedLimit + parsedImpressions;
}
