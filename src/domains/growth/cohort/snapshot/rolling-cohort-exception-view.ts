import * as text from "../../../../kit/text.js";
import { RollingCohortException } from "./rolling-cohort-exception.js";

/** How screens and exports show a rolling cohort exception. */
export class RollingCohortExceptionView {
  codeText: string;
  nameText: string;
  active: string;
  durationMinutes: string;
  campaignRef: string;
  discountText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    active: string,
    durationMinutes: string,
    campaignRef: string,
    discountText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.active = active;
    this.durationMinutes = durationMinutes;
    this.campaignRef = campaignRef;
    this.discountText = discountText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingCohortExceptionView(item: RollingCohortException): RollingCohortExceptionView {
  return new RollingCohortExceptionView(
    item.code,
    item.name,
    `${item.active}`,
    String(item.durationMinutes),
    text.truncate(item.campaignRef, 120),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingCohortExceptionViews(items: RollingCohortException[]): RollingCohortExceptionView[] {
  const views: RollingCohortExceptionView[] = [];
  for (const item of items) {
    views.push(toRollingCohortExceptionView(item));
  }
  return views;
}

export function sumRollingCohortExceptionView(view: RollingCohortExceptionView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedDurationMinutes + parsedDiscount;
}
