import * as text from "../../../../kit/text.js";
import { CreditPolicy } from "./credit-policy.js";

/** How screens and exports show a credit policy. */
export class CreditPolicyView {
  codeText: string;
  name: string;
  ratio: string;
  pinned: string;
  clicks: string;
  statusLabel: string;

  constructor(codeText: string, name: string, ratio: string, pinned: string, clicks: string, statusLabel: string) {
    this.codeText = codeText;
    this.name = name;
    this.ratio = ratio;
    this.pinned = pinned;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toCreditPolicyView(item: CreditPolicy): CreditPolicyView {
  return new CreditPolicyView(
    item.code,
    text.truncate(item.name, 80),
    item.ratio.toFixed(2),
    `${item.pinned}`,
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditPolicyViews(items: CreditPolicy[]): CreditPolicyView[] {
  const views: CreditPolicyView[] = [];
  for (const item of items) {
    views.push(toCreditPolicyView(item));
  }
  return views;
}

export function sumCreditPolicyView(view: CreditPolicyView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedRatio + parsedClicks;
}
