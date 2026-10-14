import * as text from "../../../../kit/text.js";
import { LegacyWaitException } from "./legacy-wait-exception.js";

/** How screens and exports show a legacy wait exception. */
export class LegacyWaitExceptionView {
  code: string;
  name: string;
  sequence: string;
  country: string;
  quantity: string;
  updatedAtText: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    sequence: string,
    country: string,
    quantity: string,
    updatedAtText: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.country = country;
    this.quantity = quantity;
    this.updatedAtText = updatedAtText;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyWaitExceptionView(item: LegacyWaitException): LegacyWaitExceptionView {
  return new LegacyWaitExceptionView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 80),
    String(item.sequence),
    item.country,
    String(item.quantity),
    String(item.updatedAt),
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyWaitExceptionViews(items: LegacyWaitException[]): LegacyWaitExceptionView[] {
  const views: LegacyWaitExceptionView[] = [];
  for (const item of items) {
    views.push(toLegacyWaitExceptionView(item));
  }
  return views;
}

export function sumLegacyWaitExceptionView(view: LegacyWaitExceptionView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedSequence + parsedQuantity + parsedUpdatedAt;
}
