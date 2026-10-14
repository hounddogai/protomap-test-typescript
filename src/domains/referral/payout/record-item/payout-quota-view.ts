import * as text from "../../../../kit/text.js";
import { PayoutQuota } from "./payout-quota.js";

/** How screens and exports show a payout quota. */
export class PayoutQuotaView {
  codeText: string;
  titleText: string;
  attempts: string;
  floorValue: string;
  journeyIdText: string;
  weightText: string;
  audienceId: string;
  regionText: string;
  openRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    attempts: string,
    floorValue: string,
    journeyIdText: string,
    weightText: string,
    audienceId: string,
    regionText: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.attempts = attempts;
    this.floorValue = floorValue;
    this.journeyIdText = journeyIdText;
    this.weightText = weightText;
    this.audienceId = audienceId;
    this.regionText = regionText;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutQuotaView(item: PayoutQuota): PayoutQuotaView {
  return new PayoutQuotaView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 64),
    String(item.attempts),
    item.floorValue.toFixed(2),
    item.journeyId,
    item.weight.toFixed(2),
    text.truncate(item.audienceId, 64),
    item.region,
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutQuotaViews(items: PayoutQuota[]): PayoutQuotaView[] {
  const views: PayoutQuotaView[] = [];
  for (const item of items) {
    views.push(toPayoutQuotaView(item));
  }
  return views;
}

export function sumPayoutQuotaView(view: PayoutQuotaView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedAttempts + parsedFloorValue + parsedWeight;
}
