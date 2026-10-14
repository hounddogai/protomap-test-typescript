import * as text from "../../../../kit/text.js";
import { PrimaryEscalationAdjustment } from "./primary-escalation-adjustment.js";

/** How screens and exports show a primary escalation adjustment. */
export class PrimaryEscalationAdjustmentView {
  codeText: string;
  label: string;
  category: string;
  sendAt: string;
  conversionRate: string;
  campaignRef: string;
  ratioText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    category: string,
    sendAt: string,
    conversionRate: string,
    campaignRef: string,
    ratioText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.category = category;
    this.sendAt = sendAt;
    this.conversionRate = conversionRate;
    this.campaignRef = campaignRef;
    this.ratioText = ratioText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryEscalationAdjustmentView(item: PrimaryEscalationAdjustment): PrimaryEscalationAdjustmentView {
  return new PrimaryEscalationAdjustmentView(
    item.code,
    item.label,
    item.category,
    String(item.sendAt),
    item.conversionRate.toFixed(2),
    text.truncate(item.campaignRef, 40),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryEscalationAdjustmentViews(items: PrimaryEscalationAdjustment[]): PrimaryEscalationAdjustmentView[] {
  const views: PrimaryEscalationAdjustmentView[] = [];
  for (const item of items) {
    views.push(toPrimaryEscalationAdjustmentView(item));
  }
  return views;
}

export function sumPrimaryEscalationAdjustmentView(view: PrimaryEscalationAdjustmentView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedSendAt + parsedConversionRate + parsedRatio;
}
