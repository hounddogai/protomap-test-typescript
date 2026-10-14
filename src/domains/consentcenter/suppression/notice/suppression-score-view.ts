import * as text from "../../../../kit/text.js";
import { SuppressionScore } from "./suppression-score.js";

/** How screens and exports show a suppression score. */
export class SuppressionScoreView {
  code: string;
  label: string;
  quantity: string;
  source: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    quantity: string,
    source: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.source = source;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionScoreView(item: SuppressionScore): SuppressionScoreView {
  return new SuppressionScoreView(
    item.code,
    item.label,
    String(item.quantity),
    text.truncate(item.source, 40),
    text.truncate(item.description, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionScoreViews(items: SuppressionScore[]): SuppressionScoreView[] {
  const views: SuppressionScoreView[] = [];
  for (const item of items) {
    views.push(toSuppressionScoreView(item));
  }
  return views;
}

export function sumSuppressionScoreView(view: SuppressionScoreView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
