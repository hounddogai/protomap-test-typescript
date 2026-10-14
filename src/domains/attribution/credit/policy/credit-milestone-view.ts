import * as text from "../../../../kit/text.js";
import { CreditMilestone } from "./credit-milestone.js";

/** How screens and exports show a credit milestone. */
export class CreditMilestoneView {
  codeText: string;
  title: string;
  retries: string;
  visible: string;
  channel: string;
  audienceId: string;
  minimumText: string;
  sequence: string;
  discount: string;
  impressions: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    retries: string,
    visible: string,
    channel: string,
    audienceId: string,
    minimumText: string,
    sequence: string,
    discount: string,
    impressions: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.retries = retries;
    this.visible = visible;
    this.channel = channel;
    this.audienceId = audienceId;
    this.minimumText = minimumText;
    this.sequence = sequence;
    this.discount = discount;
    this.impressions = impressions;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toCreditMilestoneView(item: CreditMilestone): CreditMilestoneView {
  return new CreditMilestoneView(
    item.code,
    item.title,
    String(item.retries),
    `${item.visible}`,
    item.channel,
    text.truncate(item.audienceId, 120),
    item.minimum.toFixed(2),
    String(item.sequence),
    item.discount.toFixed(2),
    String(item.impressions),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditMilestoneViews(items: CreditMilestone[]): CreditMilestoneView[] {
  const views: CreditMilestoneView[] = [];
  for (const item of items) {
    views.push(toCreditMilestoneView(item));
  }
  return views;
}

export function sumCreditMilestoneView(view: CreditMilestoneView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedRetries + parsedMinimum + parsedSequence;
}
