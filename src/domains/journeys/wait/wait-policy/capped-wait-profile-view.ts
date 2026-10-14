import * as text from "../../../../kit/text.js";
import { CappedWaitProfile } from "./capped-wait-profile.js";

/** How screens and exports show a capped wait profile. */
export class CappedWaitProfileView {
  codeText: string;
  nameText: string;
  margin: string;
  quantity: string;
  currency: string;
  endsAt: string;
  amount: string;
  source: string;
  sequenceText: string;
  country: string;
  archived: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    margin: string,
    quantity: string,
    currency: string,
    endsAt: string,
    amount: string,
    source: string,
    sequenceText: string,
    country: string,
    archived: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.margin = margin;
    this.quantity = quantity;
    this.currency = currency;
    this.endsAt = endsAt;
    this.amount = amount;
    this.source = source;
    this.sequenceText = sequenceText;
    this.country = country;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toCappedWaitProfileView(item: CappedWaitProfile): CappedWaitProfileView {
  return new CappedWaitProfileView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 80),
    item.margin.toFixed(2),
    String(item.quantity),
    item.currency,
    String(item.endsAt),
    item.amount.toFixed(2),
    text.truncate(item.source, 80),
    String(item.sequence),
    item.country,
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedWaitProfileViews(items: CappedWaitProfile[]): CappedWaitProfileView[] {
  const views: CappedWaitProfileView[] = [];
  for (const item of items) {
    views.push(toCappedWaitProfileView(item));
  }
  return views;
}

export function sumCappedWaitProfileView(view: CappedWaitProfileView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedMargin + parsedQuantity + parsedEndsAt;
}
