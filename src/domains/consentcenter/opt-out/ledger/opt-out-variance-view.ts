import * as text from "../../../../kit/text.js";
import { OptOutVariance } from "./opt-out-variance.js";

/** How screens and exports show a opt out variance. */
export class OptOutVarianceView {
  code: string;
  name: string;
  priorityText: string;
  unit: string;
  campaignRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    priorityText: string,
    unit: string,
    campaignRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.priorityText = priorityText;
    this.unit = unit;
    this.campaignRefText = campaignRefText;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutVarianceView(item: OptOutVariance): OptOutVarianceView {
  return new OptOutVarianceView(
    item.code,
    text.truncate(item.name, 80),
    String(item.priority),
    item.unit,
    text.truncate(item.campaignRef, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutVarianceViews(items: OptOutVariance[]): OptOutVarianceView[] {
  const views: OptOutVarianceView[] = [];
  for (const item of items) {
    views.push(toOptOutVarianceView(item));
  }
  return views;
}

export function sumOptOutVarianceView(view: OptOutVarianceView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedPriority;
}
