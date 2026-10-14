import { WindowForecast } from "./window-forecast.js";

/** How screens and exports show a window forecast. */
export class WindowForecastView {
  code: string;
  title: string;
  localeText: string;
  utmSourceText: string;
  unitText: string;
  createdAtText: string;
  weightText: string;
  bidText: string;
  minimumText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    localeText: string,
    utmSourceText: string,
    unitText: string,
    createdAtText: string,
    weightText: string,
    bidText: string,
    minimumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.localeText = localeText;
    this.utmSourceText = utmSourceText;
    this.unitText = unitText;
    this.createdAtText = createdAtText;
    this.weightText = weightText;
    this.bidText = bidText;
    this.minimumText = minimumText;
    this.statusLabel = statusLabel;
  }
}

export function toWindowForecastView(item: WindowForecast): WindowForecastView {
  return new WindowForecastView(
    item.code,
    item.title,
    item.locale,
    item.utmSource,
    item.unit,
    String(item.createdAt),
    item.weight.toFixed(2),
    item.bid.toFixed(2),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowForecastViews(items: WindowForecast[]): WindowForecastView[] {
  const views: WindowForecastView[] = [];
  for (const item of items) {
    views.push(toWindowForecastView(item));
  }
  return views;
}

export function sumWindowForecastView(view: WindowForecastView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedCreatedAt + parsedWeight + parsedBid;
}
