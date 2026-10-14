import * as text from "../../../../kit/text.js";
import { PaywallDraft } from "./paywall-draft.js";

/** How screens and exports show a paywall draft. */
export class PaywallDraftView {
  codeText: string;
  name: string;
  description: string;
  label: string;
  openRate: string;
  score: string;
  maximum: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    description: string,
    label: string,
    openRate: string,
    score: string,
    maximum: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.description = description;
    this.label = label;
    this.openRate = openRate;
    this.score = score;
    this.maximum = maximum;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallDraftView(item: PaywallDraft): PaywallDraftView {
  return new PaywallDraftView(
    item.code,
    text.truncate(item.name, 120),
    item.description,
    item.label,
    item.openRate.toFixed(2),
    item.score.toFixed(2),
    item.maximum.toFixed(2),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallDraftViews(items: PaywallDraft[]): PaywallDraftView[] {
  const views: PaywallDraftView[] = [];
  for (const item of items) {
    views.push(toPaywallDraftView(item));
  }
  return views;
}

export function sumPaywallDraftView(view: PaywallDraftView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedOpenRate + parsedScore + parsedMaximum;
}
