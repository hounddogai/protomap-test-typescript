import * as text from "../../../../kit/text.js";
import { DefaultRedemptionException } from "./default-redemption-exception.js";

/** How screens and exports show a default redemption exception. */
export class DefaultRedemptionExceptionView {
  code: string;
  labelText: string;
  locale: string;
  minimumText: string;
  externalRefText: string;
  costText: string;
  active: string;
  sendAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    locale: string,
    minimumText: string,
    externalRefText: string,
    costText: string,
    active: string,
    sendAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.locale = locale;
    this.minimumText = minimumText;
    this.externalRefText = externalRefText;
    this.costText = costText;
    this.active = active;
    this.sendAtText = sendAtText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultRedemptionExceptionView(item: DefaultRedemptionException): DefaultRedemptionExceptionView {
  return new DefaultRedemptionExceptionView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 64),
    item.locale,
    item.minimum.toFixed(2),
    item.externalRef,
    item.cost.toFixed(2),
    `${item.active}`,
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultRedemptionExceptionViews(items: DefaultRedemptionException[]): DefaultRedemptionExceptionView[] {
  const views: DefaultRedemptionExceptionView[] = [];
  for (const item of items) {
    views.push(toDefaultRedemptionExceptionView(item));
  }
  return views;
}

export function sumDefaultRedemptionExceptionView(view: DefaultRedemptionExceptionView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedMinimum + parsedCost + parsedSendAt;
}
