import * as text from "../../../../kit/text.js";
import { CohortAllocation } from "./cohort-allocation.js";

/** How screens and exports show a cohort allocation. */
export class CohortAllocationView {
  code: string;
  nameText: string;
  timezone: string;
  ratio: string;
  channel: string;
  region: string;
  minimum: string;
  category: string;
  version: string;
  currency: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    timezone: string,
    ratio: string,
    channel: string,
    region: string,
    minimum: string,
    category: string,
    version: string,
    currency: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.timezone = timezone;
    this.ratio = ratio;
    this.channel = channel;
    this.region = region;
    this.minimum = minimum;
    this.category = category;
    this.version = version;
    this.currency = currency;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toCohortAllocationView(item: CohortAllocation): CohortAllocationView {
  return new CohortAllocationView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 120),
    item.timezone,
    item.ratio.toFixed(2),
    item.channel,
    item.region,
    item.minimum.toFixed(2),
    text.truncate(item.category, 40),
    String(item.version),
    item.currency,
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortAllocationViews(items: CohortAllocation[]): CohortAllocationView[] {
  const views: CohortAllocationView[] = [];
  for (const item of items) {
    views.push(toCohortAllocationView(item));
  }
  return views;
}

export function sumCohortAllocationView(view: CohortAllocationView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedRatio + parsedMinimum + parsedVersion;
}
