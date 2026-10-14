import { TieredCohortQuota } from "./tiered-cohort-quota.js";

/** How screens and exports show a tiered cohort quota. */
export class TieredCohortQuotaView {
  code: string;
  title: string;
  costText: string;
  summary: string;
  rate: string;
  endsAt: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    costText: string,
    summary: string,
    rate: string,
    endsAt: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.costText = costText;
    this.summary = summary;
    this.rate = rate;
    this.endsAt = endsAt;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toTieredCohortQuotaView(item: TieredCohortQuota): TieredCohortQuotaView {
  return new TieredCohortQuotaView(
    item.code,
    item.title,
    item.cost.toFixed(2),
    item.summary,
    item.rate.toFixed(2),
    String(item.endsAt),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredCohortQuotaViews(items: TieredCohortQuota[]): TieredCohortQuotaView[] {
  const views: TieredCohortQuotaView[] = [];
  for (const item of items) {
    views.push(toTieredCohortQuotaView(item));
  }
  return views;
}

export function sumTieredCohortQuotaView(view: TieredCohortQuotaView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedCost + parsedRate + parsedEndsAt;
}
