import { RollingExitRuleBaseline } from "./rolling-exit-rule-baseline.js";

/** How screens and exports show a rolling exit rule baseline. */
export class RollingExitRuleBaselineView {
  code: string;
  nameText: string;
  version: string;
  cohort: string;
  journeyIdText: string;
  bid: string;
  clicks: string;
  score: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    version: string,
    cohort: string,
    journeyIdText: string,
    bid: string,
    clicks: string,
    score: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.version = version;
    this.cohort = cohort;
    this.journeyIdText = journeyIdText;
    this.bid = bid;
    this.clicks = clicks;
    this.score = score;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toRollingExitRuleBaselineView(item: RollingExitRuleBaseline): RollingExitRuleBaselineView {
  return new RollingExitRuleBaselineView(
    item.code,
    item.name,
    String(item.version),
    item.cohort,
    item.journeyId,
    item.bid.toFixed(2),
    String(item.clicks),
    item.score.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingExitRuleBaselineViews(items: RollingExitRuleBaseline[]): RollingExitRuleBaselineView[] {
  const views: RollingExitRuleBaselineView[] = [];
  for (const item of items) {
    views.push(toRollingExitRuleBaselineView(item));
  }
  return views;
}

export function sumRollingExitRuleBaselineView(view: RollingExitRuleBaselineView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedVersion + parsedBid + parsedClicks;
}
