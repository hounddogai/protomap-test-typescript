import { FallbackQueueAdjustment } from "./fallback-queue-adjustment.js";

/** How screens and exports show a fallback queue adjustment. */
export class FallbackQueueAdjustmentView {
  code: string;
  titleText: string;
  ceiling: string;
  frequencyCapText: string;
  endsAt: string;
  priorityText: string;
  revision: string;
  currency: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    ceiling: string,
    frequencyCapText: string,
    endsAt: string,
    priorityText: string,
    revision: string,
    currency: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.ceiling = ceiling;
    this.frequencyCapText = frequencyCapText;
    this.endsAt = endsAt;
    this.priorityText = priorityText;
    this.revision = revision;
    this.currency = currency;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackQueueAdjustmentView(item: FallbackQueueAdjustment): FallbackQueueAdjustmentView {
  return new FallbackQueueAdjustmentView(
    item.code,
    item.title,
    item.ceiling.toFixed(2),
    String(item.frequencyCap),
    String(item.endsAt),
    String(item.priority),
    String(item.revision),
    item.currency,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackQueueAdjustmentViews(items: FallbackQueueAdjustment[]): FallbackQueueAdjustmentView[] {
  const views: FallbackQueueAdjustmentView[] = [];
  for (const item of items) {
    views.push(toFallbackQueueAdjustmentView(item));
  }
  return views;
}

export function sumFallbackQueueAdjustmentView(view: FallbackQueueAdjustmentView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedCeiling + parsedFrequencyCap + parsedEndsAt;
}
