import * as text from "../../../../kit/text.js";
import { LenientInsightBundle } from "./lenient-insight-bundle.js";

/** How screens and exports show a lenient insight bundle. */
export class LenientInsightBundleView {
  codeText: string;
  name: string;
  version: string;
  budget: string;
  updatedAt: string;
  amountText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    version: string,
    budget: string,
    updatedAt: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.version = version;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientInsightBundleView(item: LenientInsightBundle): LenientInsightBundleView {
  return new LenientInsightBundleView(
    item.code,
    text.truncate(item.name, 120),
    String(item.version),
    item.budget.toFixed(2),
    String(item.updatedAt),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientInsightBundleViews(items: LenientInsightBundle[]): LenientInsightBundleView[] {
  const views: LenientInsightBundleView[] = [];
  for (const item of items) {
    views.push(toLenientInsightBundleView(item));
  }
  return views;
}

export function sumLenientInsightBundleView(view: LenientInsightBundleView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedVersion + parsedBudget + parsedUpdatedAt;
}
