import * as text from "../../../../kit/text.js";
import { RetentionCycle } from "./retention-cycle.js";

/** How screens and exports show a retention cycle. */
export class RetentionCycleView {
  code: string;
  name: string;
  ceilingText: string;
  contactEmail: string;
  costText: string;
  ratio: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    ceilingText: string,
    contactEmail: string,
    costText: string,
    ratio: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.ceilingText = ceilingText;
    this.contactEmail = contactEmail;
    this.costText = costText;
    this.ratio = ratio;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionCycleView(item: RetentionCycle): RetentionCycleView {
  return new RetentionCycleView(
    item.code,
    item.name,
    item.ceiling.toFixed(2),
    item.contactEmail,
    item.cost.toFixed(2),
    item.ratio.toFixed(2),
    text.truncate(item.summary, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionCycleViews(items: RetentionCycle[]): RetentionCycleView[] {
  const views: RetentionCycleView[] = [];
  for (const item of items) {
    views.push(toRetentionCycleView(item));
  }
  return views;
}

export function sumRetentionCycleView(view: RetentionCycleView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedCeiling + parsedCost + parsedRatio;
}
