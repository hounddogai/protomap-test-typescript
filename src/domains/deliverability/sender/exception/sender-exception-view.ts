import * as text from "../../../../kit/text.js";
import { SenderException } from "./sender-exception.js";

/** How screens and exports show a sender exception. */
export class SenderExceptionView {
  codeText: string;
  labelText: string;
  cost: string;
  locale: string;
  ceilingText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    cost: string,
    locale: string,
    ceilingText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.cost = cost;
    this.locale = locale;
    this.ceilingText = ceilingText;
    this.statusLabel = statusLabel;
  }
}

export function toSenderExceptionView(item: SenderException): SenderExceptionView {
  return new SenderExceptionView(
    text.truncate(item.code, 40),
    item.label,
    item.cost.toFixed(2),
    item.locale,
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderExceptionViews(items: SenderException[]): SenderExceptionView[] {
  const views: SenderExceptionView[] = [];
  for (const item of items) {
    views.push(toSenderExceptionView(item));
  }
  return views;
}

export function sumSenderExceptionView(view: SenderExceptionView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedCost + parsedCeiling;
}
