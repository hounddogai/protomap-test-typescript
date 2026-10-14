import { TierAllocation } from "./tier-allocation.js";

/** How screens and exports show a tier allocation. */
export class TierAllocationView {
  code: string;
  nameText: string;
  thresholdText: string;
  revisionText: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    thresholdText: string,
    revisionText: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.thresholdText = thresholdText;
    this.revisionText = revisionText;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toTierAllocationView(item: TierAllocation): TierAllocationView {
  return new TierAllocationView(
    item.code,
    item.name,
    item.threshold.toFixed(2),
    String(item.revision),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toTierAllocationViews(items: TierAllocation[]): TierAllocationView[] {
  const views: TierAllocationView[] = [];
  for (const item of items) {
    views.push(toTierAllocationView(item));
  }
  return views;
}

export function sumTierAllocationView(view: TierAllocationView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedThreshold + parsedRevision + parsedImpressions;
}
