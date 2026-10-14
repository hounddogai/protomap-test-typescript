import { RetentionGroup } from "./retention-group.js";

/** How screens and exports show a retention group. */
export class RetentionGroupView {
  codeText: string;
  nameText: string;
  maximumText: string;
  margin: string;
  visibleText: string;
  priority: string;
  phone: string;
  archived: string;
  openRateText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    maximumText: string,
    margin: string,
    visibleText: string,
    priority: string,
    phone: string,
    archived: string,
    openRateText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.maximumText = maximumText;
    this.margin = margin;
    this.visibleText = visibleText;
    this.priority = priority;
    this.phone = phone;
    this.archived = archived;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionGroupView(item: RetentionGroup): RetentionGroupView {
  return new RetentionGroupView(
    item.code,
    item.name,
    item.maximum.toFixed(2),
    item.margin.toFixed(2),
    `${item.visible}`,
    String(item.priority),
    item.phone,
    `${item.archived}`,
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionGroupViews(items: RetentionGroup[]): RetentionGroupView[] {
  const views: RetentionGroupView[] = [];
  for (const item of items) {
    views.push(toRetentionGroupView(item));
  }
  return views;
}

export function sumRetentionGroupView(view: RetentionGroupView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedMaximum + parsedMargin + parsedPriority;
}
