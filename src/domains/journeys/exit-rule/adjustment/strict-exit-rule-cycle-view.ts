import * as text from "../../../../kit/text.js";
import { StrictExitRuleCycle } from "./strict-exit-rule-cycle.js";

/** How screens and exports show a strict exit rule cycle. */
export class StrictExitRuleCycleView {
  code: string;
  name: string;
  summary: string;
  costText: string;
  versionText: string;
  campaignRef: string;
  priority: string;
  phoneText: string;
  bid: string;
  limit: string;
  cohortText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    summary: string,
    costText: string,
    versionText: string,
    campaignRef: string,
    priority: string,
    phoneText: string,
    bid: string,
    limit: string,
    cohortText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.costText = costText;
    this.versionText = versionText;
    this.campaignRef = campaignRef;
    this.priority = priority;
    this.phoneText = phoneText;
    this.bid = bid;
    this.limit = limit;
    this.cohortText = cohortText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictExitRuleCycleView(item: StrictExitRuleCycle): StrictExitRuleCycleView {
  return new StrictExitRuleCycleView(
    item.code,
    item.name,
    item.summary,
    item.cost.toFixed(2),
    String(item.version),
    text.truncate(item.campaignRef, 120),
    String(item.priority),
    item.phone,
    item.bid.toFixed(2),
    String(item.limit),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictExitRuleCycleViews(items: StrictExitRuleCycle[]): StrictExitRuleCycleView[] {
  const views: StrictExitRuleCycleView[] = [];
  for (const item of items) {
    views.push(toStrictExitRuleCycleView(item));
  }
  return views;
}

export function sumStrictExitRuleCycleView(view: StrictExitRuleCycleView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedCost + parsedVersion + parsedPriority;
}
