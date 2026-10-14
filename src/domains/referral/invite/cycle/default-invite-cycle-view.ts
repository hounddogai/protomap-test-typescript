import * as text from "../../../../kit/text.js";
import { DefaultInviteCycle } from "./default-invite-cycle.js";

/** How screens and exports show a default invite cycle. */
export class DefaultInviteCycleView {
  code: string;
  label: string;
  threshold: string;
  summary: string;
  journeyId: string;
  utmSource: string;
  amountText: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    threshold: string,
    summary: string,
    journeyId: string,
    utmSource: string,
    amountText: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.summary = summary;
    this.journeyId = journeyId;
    this.utmSource = utmSource;
    this.amountText = amountText;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultInviteCycleView(item: DefaultInviteCycle): DefaultInviteCycleView {
  return new DefaultInviteCycleView(
    item.code,
    text.truncate(item.label, 40),
    item.threshold.toFixed(2),
    item.summary,
    item.journeyId,
    item.utmSource,
    item.amount.toFixed(2),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultInviteCycleViews(items: DefaultInviteCycle[]): DefaultInviteCycleView[] {
  const views: DefaultInviteCycleView[] = [];
  for (const item of items) {
    views.push(toDefaultInviteCycleView(item));
  }
  return views;
}

export function sumDefaultInviteCycleView(view: DefaultInviteCycleView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedThreshold + parsedAmount + parsedWeight;
}
