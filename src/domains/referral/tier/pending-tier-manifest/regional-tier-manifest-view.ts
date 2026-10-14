import { RegionalTierManifest } from "./regional-tier-manifest.js";

/** How screens and exports show a regional tier manifest. */
export class RegionalTierManifestView {
  codeText: string;
  label: string;
  limitText: string;
  score: string;
  endsAt: string;
  channelText: string;
  audienceId: string;
  createdAt: string;
  quantity: string;
  budgetText: string;
  amount: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    limitText: string,
    score: string,
    endsAt: string,
    channelText: string,
    audienceId: string,
    createdAt: string,
    quantity: string,
    budgetText: string,
    amount: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.limitText = limitText;
    this.score = score;
    this.endsAt = endsAt;
    this.channelText = channelText;
    this.audienceId = audienceId;
    this.createdAt = createdAt;
    this.quantity = quantity;
    this.budgetText = budgetText;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalTierManifestView(item: RegionalTierManifest): RegionalTierManifestView {
  return new RegionalTierManifestView(
    item.code,
    item.label,
    String(item.limit),
    item.score.toFixed(2),
    String(item.endsAt),
    item.channel,
    item.audienceId,
    String(item.createdAt),
    String(item.quantity),
    item.budget.toFixed(2),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalTierManifestViews(items: RegionalTierManifest[]): RegionalTierManifestView[] {
  const views: RegionalTierManifestView[] = [];
  for (const item of items) {
    views.push(toRegionalTierManifestView(item));
  }
  return views;
}

export function sumRegionalTierManifestView(view: RegionalTierManifestView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedLimit + parsedScore + parsedEndsAt;
}
