import * as text from "../../../../kit/text.js";
import { CreditOverride } from "./credit-override.js";

/** How screens and exports show a credit override. */
export class CreditOverrideView {
  codeText: string;
  name: string;
  localeText: string;
  minimumText: string;
  amountText: string;
  sendAtText: string;
  phoneText: string;
  externalRefText: string;
  impressions: string;
  visible: string;
  labelText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    localeText: string,
    minimumText: string,
    amountText: string,
    sendAtText: string,
    phoneText: string,
    externalRefText: string,
    impressions: string,
    visible: string,
    labelText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.localeText = localeText;
    this.minimumText = minimumText;
    this.amountText = amountText;
    this.sendAtText = sendAtText;
    this.phoneText = phoneText;
    this.externalRefText = externalRefText;
    this.impressions = impressions;
    this.visible = visible;
    this.labelText = labelText;
    this.statusLabel = statusLabel;
  }
}

export function toCreditOverrideView(item: CreditOverride): CreditOverrideView {
  return new CreditOverrideView(
    item.code,
    text.truncate(item.name, 120),
    item.locale,
    item.minimum.toFixed(2),
    item.amount.toFixed(2),
    String(item.sendAt),
    item.phone,
    item.externalRef,
    String(item.impressions),
    `${item.visible}`,
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditOverrideViews(items: CreditOverride[]): CreditOverrideView[] {
  const views: CreditOverrideView[] = [];
  for (const item of items) {
    views.push(toCreditOverrideView(item));
  }
  return views;
}

export function sumCreditOverrideView(view: CreditOverrideView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedMinimum + parsedAmount + parsedSendAt;
}
