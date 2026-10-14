import * as text from "../../../../kit/text.js";
import { OptOutForecast } from "./opt-out-forecast.js";

/** How screens and exports show a opt out forecast. */
export class OptOutForecastView {
  code: string;
  label: string;
  capacityText: string;
  name: string;
  statusLabel: string;

  constructor(code: string, label: string, capacityText: string, name: string, statusLabel: string) {
    this.code = code;
    this.label = label;
    this.capacityText = capacityText;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutForecastView(item: OptOutForecast): OptOutForecastView {
  return new OptOutForecastView(
    text.truncate(item.code, 64),
    item.label,
    String(item.capacity),
    text.truncate(item.name, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutForecastViews(items: OptOutForecast[]): OptOutForecastView[] {
  const views: OptOutForecastView[] = [];
  for (const item of items) {
    views.push(toOptOutForecastView(item));
  }
  return views;
}

export function sumOptOutForecastView(view: OptOutForecastView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedCapacity;
}
