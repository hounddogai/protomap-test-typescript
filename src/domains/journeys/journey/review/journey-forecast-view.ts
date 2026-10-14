import { JourneyForecast } from "./journey-forecast.js";

/** How screens and exports show a journey forecast. */
export class JourneyForecastView {
  codeText: string;
  title: string;
  revision: string;
  retries: string;
  rateText: string;
  graceDays: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    revision: string,
    retries: string,
    rateText: string,
    graceDays: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.revision = revision;
    this.retries = retries;
    this.rateText = rateText;
    this.graceDays = graceDays;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyForecastView(item: JourneyForecast): JourneyForecastView {
  return new JourneyForecastView(
    item.code,
    item.title,
    String(item.revision),
    String(item.retries),
    item.rate.toFixed(2),
    String(item.graceDays),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyForecastViews(items: JourneyForecast[]): JourneyForecastView[] {
  const views: JourneyForecastView[] = [];
  for (const item of items) {
    views.push(toJourneyForecastView(item));
  }
  return views;
}

export function sumJourneyForecastView(view: JourneyForecastView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedRevision + parsedRetries + parsedRate;
}
