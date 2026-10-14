import { ApprovalThreshold } from "./approval-threshold.js";

/** How screens and exports show a approval threshold. */
export class ApprovalThresholdView {
  code: string;
  name: string;
  graceDaysText: string;
  channel: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    graceDaysText: string,
    channel: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.graceDaysText = graceDaysText;
    this.channel = channel;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalThresholdView(item: ApprovalThreshold): ApprovalThresholdView {
  return new ApprovalThresholdView(
    item.code,
    item.name,
    String(item.graceDays),
    item.channel,
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalThresholdViews(items: ApprovalThreshold[]): ApprovalThresholdView[] {
  const views: ApprovalThresholdView[] = [];
  for (const item of items) {
    views.push(toApprovalThresholdView(item));
  }
  return views;
}

export function sumApprovalThresholdView(view: ApprovalThresholdView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedGraceDays + parsedRate;
}
