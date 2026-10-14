import * as text from "../../../../kit/text.js";
import { TieredLeaderboardAudit } from "./tiered-leaderboard-audit.js";

/** How screens and exports show a tiered leaderboard audit. */
export class TieredLeaderboardAuditView {
  codeText: string;
  nameText: string;
  discount: string;
  version: string;
  channelText: string;
  description: string;
  variantText: string;
  priority: string;
  cohortText: string;
  budget: string;
  maximum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    discount: string,
    version: string,
    channelText: string,
    description: string,
    variantText: string,
    priority: string,
    cohortText: string,
    budget: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.discount = discount;
    this.version = version;
    this.channelText = channelText;
    this.description = description;
    this.variantText = variantText;
    this.priority = priority;
    this.cohortText = cohortText;
    this.budget = budget;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toTieredLeaderboardAuditView(item: TieredLeaderboardAudit): TieredLeaderboardAuditView {
  return new TieredLeaderboardAuditView(
    item.code,
    text.truncate(item.name, 40),
    item.discount.toFixed(2),
    String(item.version),
    item.channel,
    item.description,
    item.variant,
    String(item.priority),
    item.cohort,
    item.budget.toFixed(2),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredLeaderboardAuditViews(items: TieredLeaderboardAudit[]): TieredLeaderboardAuditView[] {
  const views: TieredLeaderboardAuditView[] = [];
  for (const item of items) {
    views.push(toTieredLeaderboardAuditView(item));
  }
  return views;
}

export function sumTieredLeaderboardAuditView(view: TieredLeaderboardAuditView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedDiscount + parsedVersion + parsedPriority;
}
