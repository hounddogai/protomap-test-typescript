import * as text from "../../../../kit/text.js";
import { FallbackSubscriptionAudit } from "./fallback-subscription-audit.js";

/** How screens and exports show a fallback subscription audit. */
export class FallbackSubscriptionAuditView {
  code: string;
  label: string;
  ceiling: string;
  externalRefText: string;
  region: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ceiling: string,
    externalRefText: string,
    region: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.externalRefText = externalRefText;
    this.region = region;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackSubscriptionAuditView(item: FallbackSubscriptionAudit): FallbackSubscriptionAuditView {
  return new FallbackSubscriptionAuditView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 80),
    item.ceiling.toFixed(2),
    item.externalRef,
    text.truncate(item.region, 40),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackSubscriptionAuditViews(items: FallbackSubscriptionAudit[]): FallbackSubscriptionAuditView[] {
  const views: FallbackSubscriptionAuditView[] = [];
  for (const item of items) {
    views.push(toFallbackSubscriptionAuditView(item));
  }
  return views;
}

export function sumFallbackSubscriptionAuditView(view: FallbackSubscriptionAuditView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedCeiling;
}
