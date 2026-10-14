import * as text from "../../../../kit/text.js";
import { ComplaintForecast } from "./complaint-forecast.js";

/** How screens and exports show a complaint forecast. */
export class ComplaintForecastView {
  code: string;
  labelText: string;
  revisionText: string;
  unitText: string;
  scoreText: string;
  capacity: string;
  discount: string;
  retries: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    revisionText: string,
    unitText: string,
    scoreText: string,
    capacity: string,
    discount: string,
    retries: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.revisionText = revisionText;
    this.unitText = unitText;
    this.scoreText = scoreText;
    this.capacity = capacity;
    this.discount = discount;
    this.retries = retries;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintForecastView(item: ComplaintForecast): ComplaintForecastView {
  return new ComplaintForecastView(
    item.code,
    item.label,
    String(item.revision),
    text.truncate(item.unit, 120),
    item.score.toFixed(2),
    String(item.capacity),
    item.discount.toFixed(2),
    String(item.retries),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintForecastViews(items: ComplaintForecast[]): ComplaintForecastView[] {
  const views: ComplaintForecastView[] = [];
  for (const item of items) {
    views.push(toComplaintForecastView(item));
  }
  return views;
}

export function sumComplaintForecastView(view: ComplaintForecastView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedRevision + parsedScore + parsedCapacity;
}
