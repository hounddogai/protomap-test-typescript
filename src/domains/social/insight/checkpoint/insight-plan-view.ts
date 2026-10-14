import * as text from "../../../../kit/text.js";
import { InsightPlan } from "./insight-plan.js";

/** How screens and exports show a insight plan. */
export class InsightPlanView {
  code: string;
  name: string;
  revision: string;
  sourceText: string;
  weightText: string;
  approved: string;
  startsAt: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    revision: string,
    sourceText: string,
    weightText: string,
    approved: string,
    startsAt: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.sourceText = sourceText;
    this.weightText = weightText;
    this.approved = approved;
    this.startsAt = startsAt;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toInsightPlanView(item: InsightPlan): InsightPlanView {
  return new InsightPlanView(
    item.code,
    text.truncate(item.name, 80),
    String(item.revision),
    text.truncate(item.source, 80),
    item.weight.toFixed(2),
    `${item.approved}`,
    String(item.startsAt),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightPlanViews(items: InsightPlan[]): InsightPlanView[] {
  const views: InsightPlanView[] = [];
  for (const item of items) {
    views.push(toInsightPlanView(item));
  }
  return views;
}

export function sumInsightPlanView(view: InsightPlanView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedRevision + parsedWeight + parsedStartsAt;
}
