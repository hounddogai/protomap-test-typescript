import * as text from "../../../../kit/text.js";
import { GlobalPayoutDraft } from "./global-payout-draft.js";

/** How screens and exports show a global payout draft. */
export class GlobalPayoutDraftView {
  codeText: string;
  titleText: string;
  archived: string;
  version: string;
  threshold: string;
  costText: string;
  score: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    archived: string,
    version: string,
    threshold: string,
    costText: string,
    score: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.archived = archived;
    this.version = version;
    this.threshold = threshold;
    this.costText = costText;
    this.score = score;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalPayoutDraftView(item: GlobalPayoutDraft): GlobalPayoutDraftView {
  return new GlobalPayoutDraftView(
    text.truncate(item.code, 64),
    item.title,
    `${item.archived}`,
    String(item.version),
    item.threshold.toFixed(2),
    item.cost.toFixed(2),
    item.score.toFixed(2),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalPayoutDraftViews(items: GlobalPayoutDraft[]): GlobalPayoutDraftView[] {
  const views: GlobalPayoutDraftView[] = [];
  for (const item of items) {
    views.push(toGlobalPayoutDraftView(item));
  }
  return views;
}

export function sumGlobalPayoutDraftView(view: GlobalPayoutDraftView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedVersion + parsedThreshold + parsedCost;
}
