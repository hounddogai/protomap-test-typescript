import * as text from "../../../../kit/text.js";
import { StrictStreakTemplate } from "./strict-streak-template.js";

/** How screens and exports show a strict streak template. */
export class StrictStreakTemplateView {
  code: string;
  titleText: string;
  minimumText: string;
  checksumText: string;
  cohort: string;
  utmSource: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    minimumText: string,
    checksumText: string,
    cohort: string,
    utmSource: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.minimumText = minimumText;
    this.checksumText = checksumText;
    this.cohort = cohort;
    this.utmSource = utmSource;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toStrictStreakTemplateView(item: StrictStreakTemplate): StrictStreakTemplateView {
  return new StrictStreakTemplateView(
    item.code,
    item.title,
    item.minimum.toFixed(2),
    text.truncate(item.checksum, 80),
    item.cohort,
    item.utmSource,
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictStreakTemplateViews(items: StrictStreakTemplate[]): StrictStreakTemplateView[] {
  const views: StrictStreakTemplateView[] = [];
  for (const item of items) {
    views.push(toStrictStreakTemplateView(item));
  }
  return views;
}

export function sumStrictStreakTemplateView(view: StrictStreakTemplateView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedMinimum + parsedWeight;
}
