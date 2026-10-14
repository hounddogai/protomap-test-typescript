import * as text from "../../../../kit/text.js";
import { SlaForecast } from "./sla-forecast.js";

/** How screens and exports show a sla forecast. */
export class SlaForecastView {
  code: string;
  title: string;
  channelText: string;
  version: string;
  archived: string;
  revisionText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    channelText: string,
    version: string,
    archived: string,
    revisionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.channelText = channelText;
    this.version = version;
    this.archived = archived;
    this.revisionText = revisionText;
    this.statusLabel = statusLabel;
  }
}

export function toSlaForecastView(item: SlaForecast): SlaForecastView {
  return new SlaForecastView(
    text.truncate(item.code, 120),
    item.title,
    text.truncate(item.channel, 120),
    String(item.version),
    `${item.archived}`,
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaForecastViews(items: SlaForecast[]): SlaForecastView[] {
  const views: SlaForecastView[] = [];
  for (const item of items) {
    views.push(toSlaForecastView(item));
  }
  return views;
}

export function sumSlaForecastView(view: SlaForecastView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedVersion + parsedRevision;
}
