import { ManualEnrollmentAllocation } from "./manual-enrollment-allocation.js";

/** How screens and exports show a manual enrollment allocation. */
export class ManualEnrollmentAllocationView {
  code: string;
  name: string;
  source: string;
  scoreText: string;
  openRate: string;
  limit: string;
  budget: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    source: string,
    scoreText: string,
    openRate: string,
    limit: string,
    budget: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.scoreText = scoreText;
    this.openRate = openRate;
    this.limit = limit;
    this.budget = budget;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toManualEnrollmentAllocationView(item: ManualEnrollmentAllocation): ManualEnrollmentAllocationView {
  return new ManualEnrollmentAllocationView(
    item.code,
    item.name,
    item.source,
    item.score.toFixed(2),
    item.openRate.toFixed(2),
    String(item.limit),
    item.budget.toFixed(2),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualEnrollmentAllocationViews(items: ManualEnrollmentAllocation[]): ManualEnrollmentAllocationView[] {
  const views: ManualEnrollmentAllocationView[] = [];
  for (const item of items) {
    views.push(toManualEnrollmentAllocationView(item));
  }
  return views;
}

export function sumManualEnrollmentAllocationView(view: ManualEnrollmentAllocationView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedScore + parsedOpenRate + parsedLimit;
}
