import * as text from "../../../../kit/text.js";
import { BadgeAudit } from "./badge-audit.js";

/** How screens and exports show a badge audit. */
export class BadgeAuditView {
  codeText: string;
  name: string;
  attempts: string;
  timezone: string;
  expiresAt: string;
  minimumText: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    attempts: string,
    timezone: string,
    expiresAt: string,
    minimumText: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.attempts = attempts;
    this.timezone = timezone;
    this.expiresAt = expiresAt;
    this.minimumText = minimumText;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeAuditView(item: BadgeAudit): BadgeAuditView {
  return new BadgeAuditView(
    item.code,
    item.name,
    String(item.attempts),
    text.truncate(item.timezone, 120),
    String(item.expiresAt),
    item.minimum.toFixed(2),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeAuditViews(items: BadgeAudit[]): BadgeAuditView[] {
  const views: BadgeAuditView[] = [];
  for (const item of items) {
    views.push(toBadgeAuditView(item));
  }
  return views;
}

export function sumBadgeAuditView(view: BadgeAuditView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedAttempts + parsedExpiresAt + parsedMinimum;
}
