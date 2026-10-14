import { CappedEnrollmentCycle } from "./capped-enrollment-cycle.js";

/** How screens and exports show a capped enrollment cycle. */
export class CappedEnrollmentCycleView {
  code: string;
  name: string;
  segment: string;
  timezone: string;
  version: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    segment: string,
    timezone: string,
    version: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.timezone = timezone;
    this.version = version;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toCappedEnrollmentCycleView(item: CappedEnrollmentCycle): CappedEnrollmentCycleView {
  return new CappedEnrollmentCycleView(
    item.code,
    item.name,
    item.segment,
    item.timezone,
    String(item.version),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedEnrollmentCycleViews(items: CappedEnrollmentCycle[]): CappedEnrollmentCycleView[] {
  const views: CappedEnrollmentCycleView[] = [];
  for (const item of items) {
    views.push(toCappedEnrollmentCycleView(item));
  }
  return views;
}

export function sumCappedEnrollmentCycleView(view: CappedEnrollmentCycleView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedVersion + parsedBudget;
}
