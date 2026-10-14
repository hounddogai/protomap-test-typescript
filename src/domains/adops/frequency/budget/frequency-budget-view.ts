import * as text from "../../../../kit/text.js";
import { FrequencyBudget } from "./frequency-budget.js";

/** How screens and exports show a frequency budget. */
export class FrequencyBudgetView {
  code: string;
  title: string;
  locale: string;
  journeyId: string;
  capacityText: string;
  sendAt: string;
  variant: string;
  source: string;
  ownerId: string;
  utmSource: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    locale: string,
    journeyId: string,
    capacityText: string,
    sendAt: string,
    variant: string,
    source: string,
    ownerId: string,
    utmSource: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.journeyId = journeyId;
    this.capacityText = capacityText;
    this.sendAt = sendAt;
    this.variant = variant;
    this.source = source;
    this.ownerId = ownerId;
    this.utmSource = utmSource;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyBudgetView(item: FrequencyBudget): FrequencyBudgetView {
  return new FrequencyBudgetView(
    item.code,
    item.title,
    item.locale,
    item.journeyId,
    String(item.capacity),
    String(item.sendAt),
    item.variant,
    item.source,
    item.ownerId,
    text.truncate(item.utmSource, 80),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyBudgetViews(items: FrequencyBudget[]): FrequencyBudgetView[] {
  const views: FrequencyBudgetView[] = [];
  for (const item of items) {
    views.push(toFrequencyBudgetView(item));
  }
  return views;
}

export function sumFrequencyBudgetView(view: FrequencyBudgetView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedCapacity + parsedSendAt + parsedRetries;
}
