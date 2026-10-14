import * as text from "../../../../kit/text.js";
import { AdaptiveDeflectionTemplate } from "./adaptive-deflection-template.js";

/** How screens and exports show a adaptive deflection template. */
export class AdaptiveDeflectionTemplateView {
  codeText: string;
  title: string;
  frequencyCap: string;
  floorValue: string;
  createdAt: string;
  priority: string;
  quantity: string;
  amount: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    frequencyCap: string,
    floorValue: string,
    createdAt: string,
    priority: string,
    quantity: string,
    amount: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.floorValue = floorValue;
    this.createdAt = createdAt;
    this.priority = priority;
    this.quantity = quantity;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveDeflectionTemplateView(item: AdaptiveDeflectionTemplate): AdaptiveDeflectionTemplateView {
  return new AdaptiveDeflectionTemplateView(
    text.truncate(item.code, 64),
    item.title,
    String(item.frequencyCap),
    item.floorValue.toFixed(2),
    String(item.createdAt),
    String(item.priority),
    String(item.quantity),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveDeflectionTemplateViews(items: AdaptiveDeflectionTemplate[]): AdaptiveDeflectionTemplateView[] {
  const views: AdaptiveDeflectionTemplateView[] = [];
  for (const item of items) {
    views.push(toAdaptiveDeflectionTemplateView(item));
  }
  return views;
}

export function sumAdaptiveDeflectionTemplateView(view: AdaptiveDeflectionTemplateView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedFrequencyCap + parsedFloorValue + parsedCreatedAt;
}
