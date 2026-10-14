import * as text from "../../../../kit/text.js";
import { ActivationAdjustment } from "./activation-adjustment.js";

/** How screens and exports show a activation adjustment. */
export class ActivationAdjustmentView {
  code: string;
  title: string;
  journeyId: string;
  contactEmail: string;
  visible: string;
  rate: string;
  channel: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    contactEmail: string,
    visible: string,
    rate: string,
    channel: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.contactEmail = contactEmail;
    this.visible = visible;
    this.rate = rate;
    this.channel = channel;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toActivationAdjustmentView(item: ActivationAdjustment): ActivationAdjustmentView {
  return new ActivationAdjustmentView(
    item.code,
    item.title,
    text.truncate(item.journeyId, 40),
    text.truncate(item.contactEmail, 64),
    `${item.visible}`,
    item.rate.toFixed(2),
    item.channel,
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationAdjustmentViews(items: ActivationAdjustment[]): ActivationAdjustmentView[] {
  const views: ActivationAdjustmentView[] = [];
  for (const item of items) {
    views.push(toActivationAdjustmentView(item));
  }
  return views;
}

export function sumActivationAdjustmentView(view: ActivationAdjustmentView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedRate;
}
