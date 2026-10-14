import { ManualSubscriptionSegment } from "./manual-subscription-segment.js";

/** How screens and exports show a manual subscription segment. */
export class ManualSubscriptionSegmentView {
  codeText: string;
  titleText: string;
  ceilingText: string;
  versionText: string;
  visibleText: string;
  cost: string;
  floorValueText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    ceilingText: string,
    versionText: string,
    visibleText: string,
    cost: string,
    floorValueText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.ceilingText = ceilingText;
    this.versionText = versionText;
    this.visibleText = visibleText;
    this.cost = cost;
    this.floorValueText = floorValueText;
    this.statusLabel = statusLabel;
  }
}

export function toManualSubscriptionSegmentView(item: ManualSubscriptionSegment): ManualSubscriptionSegmentView {
  return new ManualSubscriptionSegmentView(
    item.code,
    item.title,
    item.ceiling.toFixed(2),
    String(item.version),
    `${item.visible}`,
    item.cost.toFixed(2),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualSubscriptionSegmentViews(items: ManualSubscriptionSegment[]): ManualSubscriptionSegmentView[] {
  const views: ManualSubscriptionSegmentView[] = [];
  for (const item of items) {
    views.push(toManualSubscriptionSegmentView(item));
  }
  return views;
}

export function sumManualSubscriptionSegmentView(view: ManualSubscriptionSegmentView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedCeiling + parsedVersion + parsedCost;
}
