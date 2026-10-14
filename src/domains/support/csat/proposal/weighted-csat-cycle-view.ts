import * as text from "../../../../kit/text.js";
import { WeightedCsatCycle } from "./weighted-csat-cycle.js";

/** How screens and exports show a weighted csat cycle. */
export class WeightedCsatCycleView {
  code: string;
  name: string;
  timezoneText: string;
  revision: string;
  expiresAtText: string;
  reviewer: string;
  currency: string;
  createdAt: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    timezoneText: string,
    revision: string,
    expiresAtText: string,
    reviewer: string,
    currency: string,
    createdAt: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.timezoneText = timezoneText;
    this.revision = revision;
    this.expiresAtText = expiresAtText;
    this.reviewer = reviewer;
    this.currency = currency;
    this.createdAt = createdAt;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedCsatCycleView(item: WeightedCsatCycle): WeightedCsatCycleView {
  return new WeightedCsatCycleView(
    item.code,
    text.truncate(item.name, 80),
    item.timezone,
    String(item.revision),
    String(item.expiresAt),
    item.reviewer,
    item.currency,
    String(item.createdAt),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedCsatCycleViews(items: WeightedCsatCycle[]): WeightedCsatCycleView[] {
  const views: WeightedCsatCycleView[] = [];
  for (const item of items) {
    views.push(toWeightedCsatCycleView(item));
  }
  return views;
}

export function sumWeightedCsatCycleView(view: WeightedCsatCycleView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedRevision + parsedExpiresAt + parsedCreatedAt;
}
