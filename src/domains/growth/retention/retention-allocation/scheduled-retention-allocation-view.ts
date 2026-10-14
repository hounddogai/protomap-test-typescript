import { ScheduledRetentionAllocation } from "./scheduled-retention-allocation.js";

/** How screens and exports show a scheduled retention allocation. */
export class ScheduledRetentionAllocationView {
  code: string;
  name: string;
  ceiling: string;
  label: string;
  maximum: string;
  statusLabel: string;

  constructor(code: string, name: string, ceiling: string, label: string, maximum: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.label = label;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledRetentionAllocationView(item: ScheduledRetentionAllocation): ScheduledRetentionAllocationView {
  return new ScheduledRetentionAllocationView(
    item.code,
    item.name,
    item.ceiling.toFixed(2),
    item.label,
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledRetentionAllocationViews(items: ScheduledRetentionAllocation[]): ScheduledRetentionAllocationView[] {
  const views: ScheduledRetentionAllocationView[] = [];
  for (const item of items) {
    views.push(toScheduledRetentionAllocationView(item));
  }
  return views;
}

export function sumScheduledRetentionAllocationView(view: ScheduledRetentionAllocationView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedCeiling + parsedMaximum;
}
