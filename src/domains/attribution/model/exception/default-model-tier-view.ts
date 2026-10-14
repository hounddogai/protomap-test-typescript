import * as text from "../../../../kit/text.js";
import { DefaultModelTier } from "./default-model-tier.js";

/** How screens and exports show a default model tier. */
export class DefaultModelTierView {
  codeText: string;
  label: string;
  priority: string;
  ceiling: string;
  active: string;
  frequencyCap: string;
  createdAt: string;
  currencyText: string;
  endsAtText: string;
  minimum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    priority: string,
    ceiling: string,
    active: string,
    frequencyCap: string,
    createdAt: string,
    currencyText: string,
    endsAtText: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.priority = priority;
    this.ceiling = ceiling;
    this.active = active;
    this.frequencyCap = frequencyCap;
    this.createdAt = createdAt;
    this.currencyText = currencyText;
    this.endsAtText = endsAtText;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultModelTierView(item: DefaultModelTier): DefaultModelTierView {
  return new DefaultModelTierView(
    text.truncate(item.code, 40),
    item.label,
    String(item.priority),
    item.ceiling.toFixed(2),
    `${item.active}`,
    String(item.frequencyCap),
    String(item.createdAt),
    item.currency,
    String(item.endsAt),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultModelTierViews(items: DefaultModelTier[]): DefaultModelTierView[] {
  const views: DefaultModelTierView[] = [];
  for (const item of items) {
    views.push(toDefaultModelTierView(item));
  }
  return views;
}

export function sumDefaultModelTierView(view: DefaultModelTierView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedPriority + parsedCeiling + parsedFrequencyCap;
}
