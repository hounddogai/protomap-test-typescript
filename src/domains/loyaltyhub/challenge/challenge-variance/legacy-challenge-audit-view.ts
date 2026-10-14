import * as text from "../../../../kit/text.js";
import { LegacyChallengeAudit } from "./legacy-challenge-audit.js";

/** How screens and exports show a legacy challenge audit. */
export class LegacyChallengeAuditView {
  codeText: string;
  title: string;
  expiresAt: string;
  nameText: string;
  windowDays: string;
  budget: string;
  region: string;
  impressions: string;
  amountText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    expiresAt: string,
    nameText: string,
    windowDays: string,
    budget: string,
    region: string,
    impressions: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.expiresAt = expiresAt;
    this.nameText = nameText;
    this.windowDays = windowDays;
    this.budget = budget;
    this.region = region;
    this.impressions = impressions;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyChallengeAuditView(item: LegacyChallengeAudit): LegacyChallengeAuditView {
  return new LegacyChallengeAuditView(
    item.code,
    item.title,
    String(item.expiresAt),
    item.name,
    String(item.windowDays),
    item.budget.toFixed(2),
    text.truncate(item.region, 120),
    String(item.impressions),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyChallengeAuditViews(items: LegacyChallengeAudit[]): LegacyChallengeAuditView[] {
  const views: LegacyChallengeAuditView[] = [];
  for (const item of items) {
    views.push(toLegacyChallengeAuditView(item));
  }
  return views;
}

export function sumLegacyChallengeAuditView(view: LegacyChallengeAuditView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedExpiresAt + parsedWindowDays + parsedBudget;
}
