import { PendingCohortProfile } from "./pending-cohort-profile.js";

/** How screens and exports show a pending cohort profile. */
export class PendingCohortProfileView {
  codeText: string;
  label: string;
  retries: string;
  unitText: string;
  externalRefText: string;
  timezone: string;
  approved: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    retries: string,
    unitText: string,
    externalRefText: string,
    timezone: string,
    approved: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.retries = retries;
    this.unitText = unitText;
    this.externalRefText = externalRefText;
    this.timezone = timezone;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toPendingCohortProfileView(item: PendingCohortProfile): PendingCohortProfileView {
  return new PendingCohortProfileView(
    item.code,
    item.label,
    String(item.retries),
    item.unit,
    item.externalRef,
    item.timezone,
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingCohortProfileViews(items: PendingCohortProfile[]): PendingCohortProfileView[] {
  const views: PendingCohortProfileView[] = [];
  for (const item of items) {
    views.push(toPendingCohortProfileView(item));
  }
  return views;
}

export function sumPendingCohortProfileView(view: PendingCohortProfileView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedRetries;
}
