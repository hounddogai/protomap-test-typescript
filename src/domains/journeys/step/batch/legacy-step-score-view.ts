import * as text from "../../../../kit/text.js";
import { LegacyStepScore } from "./legacy-step-score.js";

/** How screens and exports show a legacy step score. */
export class LegacyStepScoreView {
  codeText: string;
  titleText: string;
  name: string;
  maximumText: string;
  capacityText: string;
  durationMinutes: string;
  channelText: string;
  weight: string;
  version: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    name: string,
    maximumText: string,
    capacityText: string,
    durationMinutes: string,
    channelText: string,
    weight: string,
    version: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.name = name;
    this.maximumText = maximumText;
    this.capacityText = capacityText;
    this.durationMinutes = durationMinutes;
    this.channelText = channelText;
    this.weight = weight;
    this.version = version;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyStepScoreView(item: LegacyStepScore): LegacyStepScoreView {
  return new LegacyStepScoreView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 80),
    item.name,
    item.maximum.toFixed(2),
    String(item.capacity),
    String(item.durationMinutes),
    item.channel,
    item.weight.toFixed(2),
    String(item.version),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyStepScoreViews(items: LegacyStepScore[]): LegacyStepScoreView[] {
  const views: LegacyStepScoreView[] = [];
  for (const item of items) {
    views.push(toLegacyStepScoreView(item));
  }
  return views;
}

export function sumLegacyStepScoreView(view: LegacyStepScoreView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedMaximum + parsedCapacity + parsedDurationMinutes;
}
