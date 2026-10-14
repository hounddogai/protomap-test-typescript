import * as text from "../../../../kit/text.js";
import { StrictTicketViewBatch } from "./strict-ticket-view-batch.js";

/** How screens and exports show a strict ticket view batch. */
export class StrictTicketViewBatchView {
  code: string;
  nameText: string;
  ownerId: string;
  externalRef: string;
  category: string;
  localeText: string;
  unitText: string;
  amountText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    ownerId: string,
    externalRef: string,
    category: string,
    localeText: string,
    unitText: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.ownerId = ownerId;
    this.externalRef = externalRef;
    this.category = category;
    this.localeText = localeText;
    this.unitText = unitText;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictTicketViewBatchView(item: StrictTicketViewBatch): StrictTicketViewBatchView {
  return new StrictTicketViewBatchView(
    item.code,
    text.truncate(item.name, 120),
    item.ownerId,
    item.externalRef,
    item.category,
    item.locale,
    item.unit,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictTicketViewBatchViews(items: StrictTicketViewBatch[]): StrictTicketViewBatchView[] {
  const views: StrictTicketViewBatchView[] = [];
  for (const item of items) {
    views.push(toStrictTicketViewBatchView(item));
  }
  return views;
}

export function sumStrictTicketViewBatchView(view: StrictTicketViewBatchView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedAmount;
}
