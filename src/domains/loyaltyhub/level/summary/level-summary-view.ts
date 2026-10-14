import * as text from "../../../../kit/text.js";
import { LevelSummary } from "./level-summary.js";

/** How screens and exports show a level summary. */
export class LevelSummaryView {
  codeText: string;
  label: string;
  title: string;
  name: string;
  reviewer: string;
  visible: string;
  pinned: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    title: string,
    name: string,
    reviewer: string,
    visible: string,
    pinned: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.title = title;
    this.name = name;
    this.reviewer = reviewer;
    this.visible = visible;
    this.pinned = pinned;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toLevelSummaryView(item: LevelSummary): LevelSummaryView {
  return new LevelSummaryView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 40),
    item.title,
    text.truncate(item.name, 80),
    text.truncate(item.reviewer, 80),
    `${item.visible}`,
    `${item.pinned}`,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toLevelSummaryViews(items: LevelSummary[]): LevelSummaryView[] {
  const views: LevelSummaryView[] = [];
  for (const item of items) {
    views.push(toLevelSummaryView(item));
  }
  return views;
}

export function sumLevelSummaryView(view: LevelSummaryView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
