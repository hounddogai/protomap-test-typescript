import * as text from "../../../../kit/text.js";
import { GlobalSuppressionVariance } from "./global-suppression-variance.js";

/** How screens and exports show a global suppression variance. */
export class GlobalSuppressionVarianceView {
  codeText: string;
  label: string;
  floorValue: string;
  segment: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    floorValue: string,
    segment: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.floorValue = floorValue;
    this.segment = segment;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalSuppressionVarianceView(item: GlobalSuppressionVariance): GlobalSuppressionVarianceView {
  return new GlobalSuppressionVarianceView(
    item.code,
    item.label,
    item.floorValue.toFixed(2),
    text.truncate(item.segment, 120),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalSuppressionVarianceViews(items: GlobalSuppressionVariance[]): GlobalSuppressionVarianceView[] {
  const views: GlobalSuppressionVarianceView[] = [];
  for (const item of items) {
    views.push(toGlobalSuppressionVarianceView(item));
  }
  return views;
}

export function sumGlobalSuppressionVarianceView(view: GlobalSuppressionVarianceView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedFloorValue + parsedExpiresAt;
}
