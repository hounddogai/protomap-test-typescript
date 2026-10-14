import { MacroDigest } from "./macro-digest.js";

/** How screens and exports show a macro digest. */
export class MacroDigestView {
  code: string;
  title: string;
  windowDays: string;
  score: string;
  amount: string;
  weight: string;
  campaignRef: string;
  activeText: string;
  descriptionText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    windowDays: string,
    score: string,
    amount: string,
    weight: string,
    campaignRef: string,
    activeText: string,
    descriptionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.score = score;
    this.amount = amount;
    this.weight = weight;
    this.campaignRef = campaignRef;
    this.activeText = activeText;
    this.descriptionText = descriptionText;
    this.statusLabel = statusLabel;
  }
}

export function toMacroDigestView(item: MacroDigest): MacroDigestView {
  return new MacroDigestView(
    item.code,
    item.title,
    String(item.windowDays),
    item.score.toFixed(2),
    item.amount.toFixed(2),
    item.weight.toFixed(2),
    item.campaignRef,
    `${item.active}`,
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroDigestViews(items: MacroDigest[]): MacroDigestView[] {
  const views: MacroDigestView[] = [];
  for (const item of items) {
    views.push(toMacroDigestView(item));
  }
  return views;
}

export function sumMacroDigestView(view: MacroDigestView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedWindowDays + parsedScore + parsedAmount;
}
