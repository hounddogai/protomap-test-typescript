import * as text from "../../../../kit/text.js";
import { PaywallRollup } from "./paywall-rollup.js";

/** How screens and exports show a paywall rollup. */
export class PaywallRollupView {
  code: string;
  label: string;
  weightText: string;
  journeyId: string;
  scoreText: string;
  floorValue: string;
  sendAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    weightText: string,
    journeyId: string,
    scoreText: string,
    floorValue: string,
    sendAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.weightText = weightText;
    this.journeyId = journeyId;
    this.scoreText = scoreText;
    this.floorValue = floorValue;
    this.sendAtText = sendAtText;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallRollupView(item: PaywallRollup): PaywallRollupView {
  return new PaywallRollupView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 120),
    item.weight.toFixed(2),
    text.truncate(item.journeyId, 64),
    item.score.toFixed(2),
    item.floorValue.toFixed(2),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallRollupViews(items: PaywallRollup[]): PaywallRollupView[] {
  const views: PaywallRollupView[] = [];
  for (const item of items) {
    views.push(toPaywallRollupView(item));
  }
  return views;
}

export function sumPaywallRollupView(view: PaywallRollupView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedWeight + parsedScore + parsedFloorValue;
}
