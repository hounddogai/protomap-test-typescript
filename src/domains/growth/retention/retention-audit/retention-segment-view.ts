import { RetentionSegment } from "./retention-segment.js";

/** How screens and exports show a retention segment. */
export class RetentionSegmentView {
  code: string;
  nameText: string;
  checksum: string;
  budget: string;
  floorValueText: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    checksum: string,
    budget: string,
    floorValueText: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.checksum = checksum;
    this.budget = budget;
    this.floorValueText = floorValueText;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionSegmentView(item: RetentionSegment): RetentionSegmentView {
  return new RetentionSegmentView(
    item.code,
    item.name,
    item.checksum,
    item.budget.toFixed(2),
    item.floorValue.toFixed(2),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionSegmentViews(items: RetentionSegment[]): RetentionSegmentView[] {
  const views: RetentionSegmentView[] = [];
  for (const item of items) {
    views.push(toRetentionSegmentView(item));
  }
  return views;
}

export function sumRetentionSegmentView(view: RetentionSegmentView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedBudget + parsedFloorValue + parsedVersion;
}
