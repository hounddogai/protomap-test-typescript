import * as text from "../../../../kit/text.js";
import { FraudCheckRequest } from "./fraud-check-request.js";

/** How screens and exports show a fraud check request. */
export class FraudCheckRequestView {
  code: string;
  labelText: string;
  ceiling: string;
  sequence: string;
  endsAt: string;
  timezone: string;
  active: string;
  country: string;
  pinned: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    ceiling: string,
    sequence: string,
    endsAt: string,
    timezone: string,
    active: string,
    country: string,
    pinned: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.ceiling = ceiling;
    this.sequence = sequence;
    this.endsAt = endsAt;
    this.timezone = timezone;
    this.active = active;
    this.country = country;
    this.pinned = pinned;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckRequestView(item: FraudCheckRequest): FraudCheckRequestView {
  return new FraudCheckRequestView(
    text.truncate(item.code, 40),
    item.label,
    item.ceiling.toFixed(2),
    String(item.sequence),
    String(item.endsAt),
    text.truncate(item.timezone, 120),
    `${item.active}`,
    item.country,
    `${item.pinned}`,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckRequestViews(items: FraudCheckRequest[]): FraudCheckRequestView[] {
  const views: FraudCheckRequestView[] = [];
  for (const item of items) {
    views.push(toFraudCheckRequestView(item));
  }
  return views;
}

export function sumFraudCheckRequestView(view: FraudCheckRequestView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedCeiling + parsedSequence + parsedEndsAt;
}
