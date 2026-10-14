import { DefaultSlaForecast } from "./default-sla-forecast.js";

/** How screens and exports show a default sla forecast. */
export class DefaultSlaForecastView {
  codeText: string;
  label: string;
  openRate: string;
  activeText: string;
  score: string;
  capacity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    openRate: string,
    activeText: string,
    score: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.openRate = openRate;
    this.activeText = activeText;
    this.score = score;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultSlaForecastView(item: DefaultSlaForecast): DefaultSlaForecastView {
  return new DefaultSlaForecastView(
    item.code,
    item.label,
    item.openRate.toFixed(2),
    `${item.active}`,
    item.score.toFixed(2),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultSlaForecastViews(items: DefaultSlaForecast[]): DefaultSlaForecastView[] {
  const views: DefaultSlaForecastView[] = [];
  for (const item of items) {
    views.push(toDefaultSlaForecastView(item));
  }
  return views;
}

export function sumDefaultSlaForecastView(view: DefaultSlaForecastView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedOpenRate + parsedScore + parsedCapacity;
}
