import * as text from "../../../../kit/text.js";
import { PostManifest } from "./post-manifest.js";

/** How screens and exports show a post manifest. */
export class PostManifestView {
  code: string;
  titleText: string;
  ceilingText: string;
  rate: string;
  amount: string;
  sequence: string;
  version: string;
  budget: string;
  labelText: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    ceilingText: string,
    rate: string,
    amount: string,
    sequence: string,
    version: string,
    budget: string,
    labelText: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.ceilingText = ceilingText;
    this.rate = rate;
    this.amount = amount;
    this.sequence = sequence;
    this.version = version;
    this.budget = budget;
    this.labelText = labelText;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toPostManifestView(item: PostManifest): PostManifestView {
  return new PostManifestView(
    item.code,
    text.truncate(item.title, 120),
    item.ceiling.toFixed(2),
    item.rate.toFixed(2),
    item.amount.toFixed(2),
    String(item.sequence),
    String(item.version),
    item.budget.toFixed(2),
    item.label,
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toPostManifestViews(items: PostManifest[]): PostManifestView[] {
  const views: PostManifestView[] = [];
  for (const item of items) {
    views.push(toPostManifestView(item));
  }
  return views;
}

export function sumPostManifestView(view: PostManifestView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedCeiling + parsedRate + parsedAmount;
}
