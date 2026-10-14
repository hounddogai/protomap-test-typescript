import * as text from "../../../../kit/text.js";
import { SeasonalDomainAudit } from "./seasonal-domain-audit.js";

/** How screens and exports show a seasonal domain audit. */
export class SeasonalDomainAuditView {
  code: string;
  title: string;
  maximum: string;
  startsAt: string;
  ratioText: string;
  reviewerText: string;
  categoryText: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    maximum: string,
    startsAt: string,
    ratioText: string,
    reviewerText: string,
    categoryText: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.startsAt = startsAt;
    this.ratioText = ratioText;
    this.reviewerText = reviewerText;
    this.categoryText = categoryText;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalDomainAuditView(item: SeasonalDomainAudit): SeasonalDomainAuditView {
  return new SeasonalDomainAuditView(
    item.code,
    item.title,
    item.maximum.toFixed(2),
    String(item.startsAt),
    item.ratio.toFixed(2),
    text.truncate(item.reviewer, 40),
    item.category,
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalDomainAuditViews(items: SeasonalDomainAudit[]): SeasonalDomainAuditView[] {
  const views: SeasonalDomainAuditView[] = [];
  for (const item of items) {
    views.push(toSeasonalDomainAuditView(item));
  }
  return views;
}

export function sumSeasonalDomainAuditView(view: SeasonalDomainAuditView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedMaximum + parsedStartsAt + parsedRatio;
}
