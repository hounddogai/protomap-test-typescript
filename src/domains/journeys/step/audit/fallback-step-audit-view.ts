import * as text from "../../../../kit/text.js";
import { FallbackStepAudit } from "./fallback-step-audit.js";

/** How screens and exports show a fallback step audit. */
export class FallbackStepAuditView {
  codeText: string;
  title: string;
  locale: string;
  audienceIdText: string;
  version: string;
  amount: string;
  attempts: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    locale: string,
    audienceIdText: string,
    version: string,
    amount: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.locale = locale;
    this.audienceIdText = audienceIdText;
    this.version = version;
    this.amount = amount;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackStepAuditView(item: FallbackStepAudit): FallbackStepAuditView {
  return new FallbackStepAuditView(
    item.code,
    item.title,
    text.truncate(item.locale, 80),
    item.audienceId,
    String(item.version),
    item.amount.toFixed(2),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackStepAuditViews(items: FallbackStepAudit[]): FallbackStepAuditView[] {
  const views: FallbackStepAuditView[] = [];
  for (const item of items) {
    views.push(toFallbackStepAuditView(item));
  }
  return views;
}

export function sumFallbackStepAuditView(view: FallbackStepAuditView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedVersion + parsedAmount + parsedAttempts;
}
