import * as text from "../../../../kit/text.js";
import { ManualBounceVariance } from "./manual-bounce-variance.js";

/** How screens and exports show a manual bounce variance. */
export class ManualBounceVarianceView {
  code: string;
  label: string;
  visible: string;
  amount: string;
  campaignRef: string;
  checksum: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    visible: string,
    amount: string,
    campaignRef: string,
    checksum: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.amount = amount;
    this.campaignRef = campaignRef;
    this.checksum = checksum;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toManualBounceVarianceView(item: ManualBounceVariance): ManualBounceVarianceView {
  return new ManualBounceVarianceView(
    item.code,
    item.label,
    `${item.visible}`,
    item.amount.toFixed(2),
    item.campaignRef,
    text.truncate(item.checksum, 40),
    text.truncate(item.channel, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualBounceVarianceViews(items: ManualBounceVariance[]): ManualBounceVarianceView[] {
  const views: ManualBounceVarianceView[] = [];
  for (const item of items) {
    views.push(toManualBounceVarianceView(item));
  }
  return views;
}

export function sumManualBounceVarianceView(view: ManualBounceVarianceView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
