import * as text from "../../../../kit/text.js";
import { QueueScore } from "./queue-score.js";

/** How screens and exports show a queue score. */
export class QueueScoreView {
  codeText: string;
  name: string;
  weight: string;
  graceDays: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    weight: string,
    graceDays: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.weight = weight;
    this.graceDays = graceDays;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toQueueScoreView(item: QueueScore): QueueScoreView {
  return new QueueScoreView(
    item.code,
    text.truncate(item.name, 120),
    item.weight.toFixed(2),
    String(item.graceDays),
    text.truncate(item.locale, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueScoreViews(items: QueueScore[]): QueueScoreView[] {
  const views: QueueScoreView[] = [];
  for (const item of items) {
    views.push(toQueueScoreView(item));
  }
  return views;
}

export function sumQueueScoreView(view: QueueScoreView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedWeight + parsedGraceDays;
}
