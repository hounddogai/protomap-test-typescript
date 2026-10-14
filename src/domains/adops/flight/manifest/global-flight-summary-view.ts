import * as text from "../../../../kit/text.js";
import { GlobalFlightSummary } from "./global-flight-summary.js";

/** How screens and exports show a global flight summary. */
export class GlobalFlightSummaryView {
  code: string;
  label: string;
  maximumText: string;
  graceDays: string;
  endsAtText: string;
  versionText: string;
  currency: string;
  updatedAtText: string;
  revision: string;
  minimum: string;
  name: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    maximumText: string,
    graceDays: string,
    endsAtText: string,
    versionText: string,
    currency: string,
    updatedAtText: string,
    revision: string,
    minimum: string,
    name: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.maximumText = maximumText;
    this.graceDays = graceDays;
    this.endsAtText = endsAtText;
    this.versionText = versionText;
    this.currency = currency;
    this.updatedAtText = updatedAtText;
    this.revision = revision;
    this.minimum = minimum;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalFlightSummaryView(item: GlobalFlightSummary): GlobalFlightSummaryView {
  return new GlobalFlightSummaryView(
    item.code,
    text.truncate(item.label, 80),
    item.maximum.toFixed(2),
    String(item.graceDays),
    String(item.endsAt),
    String(item.version),
    item.currency,
    String(item.updatedAt),
    String(item.revision),
    item.minimum.toFixed(2),
    text.truncate(item.name, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalFlightSummaryViews(items: GlobalFlightSummary[]): GlobalFlightSummaryView[] {
  const views: GlobalFlightSummaryView[] = [];
  for (const item of items) {
    views.push(toGlobalFlightSummaryView(item));
  }
  return views;
}

export function sumGlobalFlightSummaryView(view: GlobalFlightSummaryView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedMaximum + parsedGraceDays + parsedEndsAt;
}
