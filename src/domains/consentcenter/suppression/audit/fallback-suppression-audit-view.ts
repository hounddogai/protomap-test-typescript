import * as text from "../../../../kit/text.js";
import { FallbackSuppressionAudit } from "./fallback-suppression-audit.js";

/** How screens and exports show a fallback suppression audit. */
export class FallbackSuppressionAuditView {
  code: string;
  title: string;
  ownerIdText: string;
  expiresAtText: string;
  conversionRate: string;
  attemptsText: string;
  revision: string;
  impressionsText: string;
  cohort: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    ownerIdText: string,
    expiresAtText: string,
    conversionRate: string,
    attemptsText: string,
    revision: string,
    impressionsText: string,
    cohort: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.ownerIdText = ownerIdText;
    this.expiresAtText = expiresAtText;
    this.conversionRate = conversionRate;
    this.attemptsText = attemptsText;
    this.revision = revision;
    this.impressionsText = impressionsText;
    this.cohort = cohort;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackSuppressionAuditView(item: FallbackSuppressionAudit): FallbackSuppressionAuditView {
  return new FallbackSuppressionAuditView(
    text.truncate(item.code, 40),
    item.title,
    item.ownerId,
    String(item.expiresAt),
    item.conversionRate.toFixed(2),
    String(item.attempts),
    String(item.revision),
    String(item.impressions),
    item.cohort,
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackSuppressionAuditViews(items: FallbackSuppressionAudit[]): FallbackSuppressionAuditView[] {
  const views: FallbackSuppressionAuditView[] = [];
  for (const item of items) {
    views.push(toFallbackSuppressionAuditView(item));
  }
  return views;
}

export function sumFallbackSuppressionAuditView(view: FallbackSuppressionAuditView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedExpiresAt + parsedConversionRate + parsedAttempts;
}
