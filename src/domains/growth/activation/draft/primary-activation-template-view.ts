import * as text from "../../../../kit/text.js";
import { PrimaryActivationTemplate } from "./primary-activation-template.js";

/** How screens and exports show a primary activation template. */
export class PrimaryActivationTemplateView {
  code: string;
  label: string;
  currency: string;
  locale: string;
  titleText: string;
  amount: string;
  ceilingText: string;
  floorValueText: string;
  visible: string;
  score: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    currency: string,
    locale: string,
    titleText: string,
    amount: string,
    ceilingText: string,
    floorValueText: string,
    visible: string,
    score: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.locale = locale;
    this.titleText = titleText;
    this.amount = amount;
    this.ceilingText = ceilingText;
    this.floorValueText = floorValueText;
    this.visible = visible;
    this.score = score;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryActivationTemplateView(item: PrimaryActivationTemplate): PrimaryActivationTemplateView {
  return new PrimaryActivationTemplateView(
    item.code,
    item.label,
    item.currency,
    text.truncate(item.locale, 40),
    item.title,
    item.amount.toFixed(2),
    item.ceiling.toFixed(2),
    item.floorValue.toFixed(2),
    `${item.visible}`,
    item.score.toFixed(2),
    text.truncate(item.channel, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryActivationTemplateViews(items: PrimaryActivationTemplate[]): PrimaryActivationTemplateView[] {
  const views: PrimaryActivationTemplateView[] = [];
  for (const item of items) {
    views.push(toPrimaryActivationTemplateView(item));
  }
  return views;
}

export function sumPrimaryActivationTemplateView(view: PrimaryActivationTemplateView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedAmount + parsedCeiling + parsedFloorValue;
}
