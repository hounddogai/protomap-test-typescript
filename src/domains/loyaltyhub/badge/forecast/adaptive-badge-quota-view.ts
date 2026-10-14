import * as text from "../../../../kit/text.js";
import { AdaptiveBadgeQuota } from "./adaptive-badge-quota.js";

/** How screens and exports show a adaptive badge quota. */
export class AdaptiveBadgeQuotaView {
  code: string;
  labelText: string;
  budgetText: string;
  retries: string;
  revisionText: string;
  variant: string;
  summaryText: string;
  externalRef: string;
  audienceIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    budgetText: string,
    retries: string,
    revisionText: string,
    variant: string,
    summaryText: string,
    externalRef: string,
    audienceIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.budgetText = budgetText;
    this.retries = retries;
    this.revisionText = revisionText;
    this.variant = variant;
    this.summaryText = summaryText;
    this.externalRef = externalRef;
    this.audienceIdText = audienceIdText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveBadgeQuotaView(item: AdaptiveBadgeQuota): AdaptiveBadgeQuotaView {
  return new AdaptiveBadgeQuotaView(
    text.truncate(item.code, 40),
    item.label,
    item.budget.toFixed(2),
    String(item.retries),
    String(item.revision),
    item.variant,
    item.summary,
    item.externalRef,
    text.truncate(item.audienceId, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveBadgeQuotaViews(items: AdaptiveBadgeQuota[]): AdaptiveBadgeQuotaView[] {
  const views: AdaptiveBadgeQuotaView[] = [];
  for (const item of items) {
    views.push(toAdaptiveBadgeQuotaView(item));
  }
  return views;
}

export function sumAdaptiveBadgeQuotaView(view: AdaptiveBadgeQuotaView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedBudget + parsedRetries + parsedRevision;
}
