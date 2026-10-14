import * as text from "../../../../kit/text.js";
import { FrequencyWindow } from "./frequency-window.js";

/** How screens and exports show a frequency window. */
export class FrequencyWindowView {
  codeText: string;
  title: string;
  graceDays: string;
  budget: string;
  journeyId: string;
  clicks: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    graceDays: string,
    budget: string,
    journeyId: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.graceDays = graceDays;
    this.budget = budget;
    this.journeyId = journeyId;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyWindowView(item: FrequencyWindow): FrequencyWindowView {
  return new FrequencyWindowView(
    text.truncate(item.code, 120),
    item.title,
    String(item.graceDays),
    item.budget.toFixed(2),
    text.truncate(item.journeyId, 80),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyWindowViews(items: FrequencyWindow[]): FrequencyWindowView[] {
  const views: FrequencyWindowView[] = [];
  for (const item of items) {
    views.push(toFrequencyWindowView(item));
  }
  return views;
}

export function sumFrequencyWindowView(view: FrequencyWindowView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedGraceDays + parsedBudget + parsedClicks;
}
