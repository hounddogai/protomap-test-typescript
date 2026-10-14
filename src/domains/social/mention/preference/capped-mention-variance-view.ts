import * as text from "../../../../kit/text.js";
import { CappedMentionVariance } from "./capped-mention-variance.js";

/** How screens and exports show a capped mention variance. */
export class CappedMentionVarianceView {
  codeText: string;
  name: string;
  budget: string;
  quantity: string;
  checksum: string;
  openRate: string;
  localeText: string;
  impressions: string;
  createdAt: string;
  journeyId: string;
  revisionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    budget: string,
    quantity: string,
    checksum: string,
    openRate: string,
    localeText: string,
    impressions: string,
    createdAt: string,
    journeyId: string,
    revisionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.budget = budget;
    this.quantity = quantity;
    this.checksum = checksum;
    this.openRate = openRate;
    this.localeText = localeText;
    this.impressions = impressions;
    this.createdAt = createdAt;
    this.journeyId = journeyId;
    this.revisionText = revisionText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedMentionVarianceView(item: CappedMentionVariance): CappedMentionVarianceView {
  return new CappedMentionVarianceView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 80),
    item.budget.toFixed(2),
    String(item.quantity),
    text.truncate(item.checksum, 40),
    item.openRate.toFixed(2),
    item.locale,
    String(item.impressions),
    String(item.createdAt),
    text.truncate(item.journeyId, 64),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedMentionVarianceViews(items: CappedMentionVariance[]): CappedMentionVarianceView[] {
  const views: CappedMentionVarianceView[] = [];
  for (const item of items) {
    views.push(toCappedMentionVarianceView(item));
  }
  return views;
}

export function sumCappedMentionVarianceView(view: CappedMentionVarianceView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedBudget + parsedQuantity + parsedOpenRate;
}
