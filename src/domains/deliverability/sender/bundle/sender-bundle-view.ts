import * as text from "../../../../kit/text.js";
import { SenderBundle } from "./sender-bundle.js";

/** How screens and exports show a sender bundle. */
export class SenderBundleView {
  code: string;
  label: string;
  ceilingText: string;
  budgetText: string;
  sendAt: string;
  conversionRate: string;
  regionText: string;
  endsAt: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ceilingText: string,
    budgetText: string,
    sendAt: string,
    conversionRate: string,
    regionText: string,
    endsAt: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ceilingText = ceilingText;
    this.budgetText = budgetText;
    this.sendAt = sendAt;
    this.conversionRate = conversionRate;
    this.regionText = regionText;
    this.endsAt = endsAt;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toSenderBundleView(item: SenderBundle): SenderBundleView {
  return new SenderBundleView(
    item.code,
    item.label,
    item.ceiling.toFixed(2),
    item.budget.toFixed(2),
    String(item.sendAt),
    item.conversionRate.toFixed(2),
    item.region,
    String(item.endsAt),
    text.truncate(item.checksum, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderBundleViews(items: SenderBundle[]): SenderBundleView[] {
  const views: SenderBundleView[] = [];
  for (const item of items) {
    views.push(toSenderBundleView(item));
  }
  return views;
}

export function sumSenderBundleView(view: SenderBundleView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedCeiling + parsedBudget + parsedSendAt;
}
