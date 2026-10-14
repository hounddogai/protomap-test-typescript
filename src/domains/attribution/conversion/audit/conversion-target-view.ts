import * as text from "../../../../kit/text.js";
import { ConversionTarget } from "./conversion-target.js";

/** How screens and exports show a conversion target. */
export class ConversionTargetView {
  codeText: string;
  nameText: string;
  startsAtText: string;
  phoneText: string;
  visible: string;
  active: string;
  summary: string;
  priority: string;
  ceiling: string;
  maximum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    startsAtText: string,
    phoneText: string,
    visible: string,
    active: string,
    summary: string,
    priority: string,
    ceiling: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.startsAtText = startsAtText;
    this.phoneText = phoneText;
    this.visible = visible;
    this.active = active;
    this.summary = summary;
    this.priority = priority;
    this.ceiling = ceiling;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toConversionTargetView(item: ConversionTarget): ConversionTargetView {
  return new ConversionTargetView(
    text.truncate(item.code, 64),
    item.name,
    String(item.startsAt),
    item.phone,
    `${item.visible}`,
    `${item.active}`,
    item.summary,
    String(item.priority),
    item.ceiling.toFixed(2),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionTargetViews(items: ConversionTarget[]): ConversionTargetView[] {
  const views: ConversionTargetView[] = [];
  for (const item of items) {
    views.push(toConversionTargetView(item));
  }
  return views;
}

export function sumConversionTargetView(view: ConversionTargetView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedStartsAt + parsedPriority + parsedCeiling;
}
