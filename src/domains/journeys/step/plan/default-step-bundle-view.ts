import * as text from "../../../../kit/text.js";
import { DefaultStepBundle } from "./default-step-bundle.js";

/** How screens and exports show a default step bundle. */
export class DefaultStepBundleView {
  code: string;
  label: string;
  visible: string;
  sequenceText: string;
  capacity: string;
  margin: string;
  locale: string;
  createdAt: string;
  bid: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    visible: string,
    sequenceText: string,
    capacity: string,
    margin: string,
    locale: string,
    createdAt: string,
    bid: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.sequenceText = sequenceText;
    this.capacity = capacity;
    this.margin = margin;
    this.locale = locale;
    this.createdAt = createdAt;
    this.bid = bid;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultStepBundleView(item: DefaultStepBundle): DefaultStepBundleView {
  return new DefaultStepBundleView(
    item.code,
    text.truncate(item.label, 80),
    `${item.visible}`,
    String(item.sequence),
    String(item.capacity),
    item.margin.toFixed(2),
    text.truncate(item.locale, 40),
    String(item.createdAt),
    item.bid.toFixed(2),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultStepBundleViews(items: DefaultStepBundle[]): DefaultStepBundleView[] {
  const views: DefaultStepBundleView[] = [];
  for (const item of items) {
    views.push(toDefaultStepBundleView(item));
  }
  return views;
}

export function sumDefaultStepBundleView(view: DefaultStepBundleView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedSequence + parsedCapacity + parsedMargin;
}
