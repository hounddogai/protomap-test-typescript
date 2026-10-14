import * as text from "../../../../kit/text.js";
import { MacroCheckpoint } from "./macro-checkpoint.js";

/** How screens and exports show a macro checkpoint. */
export class MacroCheckpointView {
  code: string;
  label: string;
  descriptionText: string;
  title: string;
  scoreText: string;
  externalRef: string;
  rateText: string;
  pinned: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    descriptionText: string,
    title: string,
    scoreText: string,
    externalRef: string,
    rateText: string,
    pinned: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.descriptionText = descriptionText;
    this.title = title;
    this.scoreText = scoreText;
    this.externalRef = externalRef;
    this.rateText = rateText;
    this.pinned = pinned;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toMacroCheckpointView(item: MacroCheckpoint): MacroCheckpointView {
  return new MacroCheckpointView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 40),
    text.truncate(item.description, 80),
    item.title,
    item.score.toFixed(2),
    text.truncate(item.externalRef, 120),
    item.rate.toFixed(2),
    `${item.pinned}`,
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroCheckpointViews(items: MacroCheckpoint[]): MacroCheckpointView[] {
  const views: MacroCheckpointView[] = [];
  for (const item of items) {
    views.push(toMacroCheckpointView(item));
  }
  return views;
}

export function sumMacroCheckpointView(view: MacroCheckpointView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedScore + parsedRate + parsedDiscount;
}
