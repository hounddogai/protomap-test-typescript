import * as text from "../../../../kit/text.js";
import { RollingSlaWindow } from "./rolling-sla-window.js";

/** How screens and exports show a rolling sla window. */
export class RollingSlaWindowView {
  code: string;
  labelText: string;
  audienceId: string;
  name: string;
  notes: string;
  amountText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    audienceId: string,
    name: string,
    notes: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.audienceId = audienceId;
    this.name = name;
    this.notes = notes;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingSlaWindowView(item: RollingSlaWindow): RollingSlaWindowView {
  return new RollingSlaWindowView(
    item.code,
    item.label,
    text.truncate(item.audienceId, 120),
    item.name,
    text.truncate(item.notes, 40),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingSlaWindowViews(items: RollingSlaWindow[]): RollingSlaWindowView[] {
  const views: RollingSlaWindowView[] = [];
  for (const item of items) {
    views.push(toRollingSlaWindowView(item));
  }
  return views;
}

export function sumRollingSlaWindowView(view: RollingSlaWindowView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedAmount;
}
