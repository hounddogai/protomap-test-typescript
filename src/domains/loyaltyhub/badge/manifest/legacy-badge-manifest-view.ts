import * as text from "../../../../kit/text.js";
import { LegacyBadgeManifest } from "./legacy-badge-manifest.js";

/** How screens and exports show a legacy badge manifest. */
export class LegacyBadgeManifestView {
  codeText: string;
  title: string;
  channel: string;
  discount: string;
  retries: string;
  audienceIdText: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    channel: string,
    discount: string,
    retries: string,
    audienceIdText: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.channel = channel;
    this.discount = discount;
    this.retries = retries;
    this.audienceIdText = audienceIdText;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyBadgeManifestView(item: LegacyBadgeManifest): LegacyBadgeManifestView {
  return new LegacyBadgeManifestView(
    item.code,
    item.title,
    text.truncate(item.channel, 64),
    item.discount.toFixed(2),
    String(item.retries),
    item.audienceId,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyBadgeManifestViews(items: LegacyBadgeManifest[]): LegacyBadgeManifestView[] {
  const views: LegacyBadgeManifestView[] = [];
  for (const item of items) {
    views.push(toLegacyBadgeManifestView(item));
  }
  return views;
}

export function sumLegacyBadgeManifestView(view: LegacyBadgeManifestView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedDiscount + parsedRetries + parsedBudget;
}
