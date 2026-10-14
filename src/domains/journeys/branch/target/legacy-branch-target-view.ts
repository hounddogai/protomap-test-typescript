import * as text from "../../../../kit/text.js";
import { LegacyBranchTarget } from "./legacy-branch-target.js";

/** How screens and exports show a legacy branch target. */
export class LegacyBranchTargetView {
  code: string;
  title: string;
  currencyText: string;
  country: string;
  budget: string;
  maximumText: string;
  sendAtText: string;
  channel: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    currencyText: string,
    country: string,
    budget: string,
    maximumText: string,
    sendAtText: string,
    channel: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.currencyText = currencyText;
    this.country = country;
    this.budget = budget;
    this.maximumText = maximumText;
    this.sendAtText = sendAtText;
    this.channel = channel;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyBranchTargetView(item: LegacyBranchTarget): LegacyBranchTargetView {
  return new LegacyBranchTargetView(
    item.code,
    item.title,
    item.currency,
    item.country,
    item.budget.toFixed(2),
    item.maximum.toFixed(2),
    String(item.sendAt),
    item.channel,
    text.truncate(item.summary, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyBranchTargetViews(items: LegacyBranchTarget[]): LegacyBranchTargetView[] {
  const views: LegacyBranchTargetView[] = [];
  for (const item of items) {
    views.push(toLegacyBranchTargetView(item));
  }
  return views;
}

export function sumLegacyBranchTargetView(view: LegacyBranchTargetView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedBudget + parsedMaximum + parsedSendAt;
}
