import { StreakAudit } from "./streak-audit.js";

/** How screens and exports show a streak audit. */
export class StreakAuditView {
  code: string;
  label: string;
  ratio: string;
  activeText: string;
  archived: string;
  segment: string;
  title: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ratio: string,
    activeText: string,
    archived: string,
    segment: string,
    title: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.activeText = activeText;
    this.archived = archived;
    this.segment = segment;
    this.title = title;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toStreakAuditView(item: StreakAudit): StreakAuditView {
  return new StreakAuditView(
    item.code,
    item.label,
    item.ratio.toFixed(2),
    `${item.active}`,
    `${item.archived}`,
    item.segment,
    item.title,
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakAuditViews(items: StreakAudit[]): StreakAuditView[] {
  const views: StreakAuditView[] = [];
  for (const item of items) {
    views.push(toStreakAuditView(item));
  }
  return views;
}

export function sumStreakAuditView(view: StreakAuditView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedRatio + parsedFloorValue;
}
