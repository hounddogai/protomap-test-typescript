import * as text from "../../../../kit/text.js";
import { PendingSlaForecast } from "./pending-sla-forecast.js";

/** How screens and exports show a pending sla forecast. */
export class PendingSlaForecastView {
  codeText: string;
  name: string;
  visible: string;
  title: string;
  maximum: string;
  country: string;
  minimumText: string;
  weightText: string;
  revision: string;
  active: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    visible: string,
    title: string,
    maximum: string,
    country: string,
    minimumText: string,
    weightText: string,
    revision: string,
    active: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.visible = visible;
    this.title = title;
    this.maximum = maximum;
    this.country = country;
    this.minimumText = minimumText;
    this.weightText = weightText;
    this.revision = revision;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toPendingSlaForecastView(item: PendingSlaForecast): PendingSlaForecastView {
  return new PendingSlaForecastView(
    item.code,
    item.name,
    `${item.visible}`,
    item.title,
    item.maximum.toFixed(2),
    text.truncate(item.country, 120),
    item.minimum.toFixed(2),
    item.weight.toFixed(2),
    String(item.revision),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingSlaForecastViews(items: PendingSlaForecast[]): PendingSlaForecastView[] {
  const views: PendingSlaForecastView[] = [];
  for (const item of items) {
    views.push(toPendingSlaForecastView(item));
  }
  return views;
}

export function sumPendingSlaForecastView(view: PendingSlaForecastView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedMaximum + parsedMinimum + parsedWeight;
}
