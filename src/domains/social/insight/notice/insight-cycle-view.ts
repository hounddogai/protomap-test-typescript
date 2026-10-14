import * as text from "../../../../kit/text.js";
import { InsightCycle } from "./insight-cycle.js";

/** How screens and exports show a insight cycle. */
export class InsightCycleView {
  code: string;
  label: string;
  attemptsText: string;
  frequencyCapText: string;
  retries: string;
  ratio: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    attemptsText: string,
    frequencyCapText: string,
    retries: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.attemptsText = attemptsText;
    this.frequencyCapText = frequencyCapText;
    this.retries = retries;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toInsightCycleView(item: InsightCycle): InsightCycleView {
  return new InsightCycleView(
    item.code,
    text.truncate(item.label, 40),
    String(item.attempts),
    String(item.frequencyCap),
    String(item.retries),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightCycleViews(items: InsightCycle[]): InsightCycleView[] {
  const views: InsightCycleView[] = [];
  for (const item of items) {
    views.push(toInsightCycleView(item));
  }
  return views;
}

export function sumInsightCycleView(view: InsightCycleView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedAttempts + parsedFrequencyCap + parsedRetries;
}
