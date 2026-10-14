import * as text from "../../../../kit/text.js";
import { FraudCheckSnapshot } from "./fraud-check-snapshot.js";

/** How screens and exports show a fraud check snapshot. */
export class FraudCheckSnapshotView {
  code: string;
  name: string;
  durationMinutes: string;
  journeyId: string;
  sendAt: string;
  discount: string;
  expiresAt: string;
  title: string;
  weightText: string;
  activeText: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    durationMinutes: string,
    journeyId: string,
    sendAt: string,
    discount: string,
    expiresAt: string,
    title: string,
    weightText: string,
    activeText: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.journeyId = journeyId;
    this.sendAt = sendAt;
    this.discount = discount;
    this.expiresAt = expiresAt;
    this.title = title;
    this.weightText = weightText;
    this.activeText = activeText;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckSnapshotView(item: FraudCheckSnapshot): FraudCheckSnapshotView {
  return new FraudCheckSnapshotView(
    item.code,
    text.truncate(item.name, 120),
    String(item.durationMinutes),
    item.journeyId,
    String(item.sendAt),
    item.discount.toFixed(2),
    String(item.expiresAt),
    item.title,
    item.weight.toFixed(2),
    `${item.active}`,
    text.truncate(item.channel, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckSnapshotViews(items: FraudCheckSnapshot[]): FraudCheckSnapshotView[] {
  const views: FraudCheckSnapshotView[] = [];
  for (const item of items) {
    views.push(toFraudCheckSnapshotView(item));
  }
  return views;
}

export function sumFraudCheckSnapshotView(view: FraudCheckSnapshotView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedDurationMinutes + parsedSendAt + parsedDiscount;
}
