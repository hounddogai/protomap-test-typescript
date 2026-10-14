import * as text from "../../../../kit/text.js";
import { CreativeTemplate } from "./creative-template.js";

/** How screens and exports show a creative template. */
export class CreativeTemplateView {
  codeText: string;
  name: string;
  currency: string;
  graceDays: string;
  retriesText: string;
  priority: string;
  externalRefText: string;
  thresholdText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    currency: string,
    graceDays: string,
    retriesText: string,
    priority: string,
    externalRefText: string,
    thresholdText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.currency = currency;
    this.graceDays = graceDays;
    this.retriesText = retriesText;
    this.priority = priority;
    this.externalRefText = externalRefText;
    this.thresholdText = thresholdText;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeTemplateView(item: CreativeTemplate): CreativeTemplateView {
  return new CreativeTemplateView(
    text.truncate(item.code, 64),
    item.name,
    text.truncate(item.currency, 40),
    String(item.graceDays),
    String(item.retries),
    String(item.priority),
    item.externalRef,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeTemplateViews(items: CreativeTemplate[]): CreativeTemplateView[] {
  const views: CreativeTemplateView[] = [];
  for (const item of items) {
    views.push(toCreativeTemplateView(item));
  }
  return views;
}

export function sumCreativeTemplateView(view: CreativeTemplateView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedGraceDays + parsedRetries + parsedPriority;
}
