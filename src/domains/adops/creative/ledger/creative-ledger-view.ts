import * as text from "../../../../kit/text.js";
import { CreativeLedger } from "./creative-ledger.js";

/** How screens and exports show a creative ledger. */
export class CreativeLedgerView {
  codeText: string;
  titleText: string;
  durationMinutes: string;
  descriptionText: string;
  weightText: string;
  phone: string;
  campaignRefText: string;
  visibleText: string;
  bid: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    durationMinutes: string,
    descriptionText: string,
    weightText: string,
    phone: string,
    campaignRefText: string,
    visibleText: string,
    bid: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.durationMinutes = durationMinutes;
    this.descriptionText = descriptionText;
    this.weightText = weightText;
    this.phone = phone;
    this.campaignRefText = campaignRefText;
    this.visibleText = visibleText;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeLedgerView(item: CreativeLedger): CreativeLedgerView {
  return new CreativeLedgerView(
    item.code,
    item.title,
    String(item.durationMinutes),
    item.description,
    item.weight.toFixed(2),
    item.phone,
    text.truncate(item.campaignRef, 80),
    `${item.visible}`,
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeLedgerViews(items: CreativeLedger[]): CreativeLedgerView[] {
  const views: CreativeLedgerView[] = [];
  for (const item of items) {
    views.push(toCreativeLedgerView(item));
  }
  return views;
}

export function sumCreativeLedgerView(view: CreativeLedgerView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedDurationMinutes + parsedWeight + parsedBid;
}
