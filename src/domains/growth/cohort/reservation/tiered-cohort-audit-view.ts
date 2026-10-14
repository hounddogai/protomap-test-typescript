import { TieredCohortAudit } from "./tiered-cohort-audit.js";

/** How screens and exports show a tiered cohort audit. */
export class TieredCohortAuditView {
  code: string;
  label: string;
  journeyId: string;
  timezone: string;
  countryText: string;
  active: string;
  reviewer: string;
  createdAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    timezone: string,
    countryText: string,
    active: string,
    reviewer: string,
    createdAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.timezone = timezone;
    this.countryText = countryText;
    this.active = active;
    this.reviewer = reviewer;
    this.createdAtText = createdAtText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredCohortAuditView(item: TieredCohortAudit): TieredCohortAuditView {
  return new TieredCohortAuditView(
    item.code,
    item.label,
    item.journeyId,
    item.timezone,
    item.country,
    `${item.active}`,
    item.reviewer,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredCohortAuditViews(items: TieredCohortAudit[]): TieredCohortAuditView[] {
  const views: TieredCohortAuditView[] = [];
  for (const item of items) {
    views.push(toTieredCohortAuditView(item));
  }
  return views;
}

export function sumTieredCohortAuditView(view: TieredCohortAuditView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedCreatedAt;
}
