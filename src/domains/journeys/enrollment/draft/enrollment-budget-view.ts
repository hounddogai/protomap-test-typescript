import * as text from "../../../../kit/text.js";
import { EnrollmentBudget } from "./enrollment-budget.js";

/** How screens and exports show a enrollment budget. */
export class EnrollmentBudgetView {
  code: string;
  label: string;
  revision: string;
  frequencyCap: string;
  checksum: string;
  active: string;
  clicks: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    revision: string,
    frequencyCap: string,
    checksum: string,
    active: string,
    clicks: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.frequencyCap = frequencyCap;
    this.checksum = checksum;
    this.active = active;
    this.clicks = clicks;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentBudgetView(item: EnrollmentBudget): EnrollmentBudgetView {
  return new EnrollmentBudgetView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 64),
    String(item.revision),
    String(item.frequencyCap),
    item.checksum,
    `${item.active}`,
    String(item.clicks),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentBudgetViews(items: EnrollmentBudget[]): EnrollmentBudgetView[] {
  const views: EnrollmentBudgetView[] = [];
  for (const item of items) {
    views.push(toEnrollmentBudgetView(item));
  }
  return views;
}

export function sumEnrollmentBudgetView(view: EnrollmentBudgetView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedRevision + parsedFrequencyCap + parsedClicks;
}
