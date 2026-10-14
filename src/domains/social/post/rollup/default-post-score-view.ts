import { DefaultPostScore } from "./default-post-score.js";

/** How screens and exports show a default post score. */
export class DefaultPostScoreView {
  code: string;
  name: string;
  minimum: string;
  sendAt: string;
  margin: string;
  statusLabel: string;

  constructor(code: string, name: string, minimum: string, sendAt: string, margin: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.sendAt = sendAt;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultPostScoreView(item: DefaultPostScore): DefaultPostScoreView {
  return new DefaultPostScoreView(
    item.code,
    item.name,
    item.minimum.toFixed(2),
    String(item.sendAt),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultPostScoreViews(items: DefaultPostScore[]): DefaultPostScoreView[] {
  const views: DefaultPostScoreView[] = [];
  for (const item of items) {
    views.push(toDefaultPostScoreView(item));
  }
  return views;
}

export function sumDefaultPostScoreView(view: DefaultPostScoreView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedMinimum + parsedSendAt + parsedMargin;
}
