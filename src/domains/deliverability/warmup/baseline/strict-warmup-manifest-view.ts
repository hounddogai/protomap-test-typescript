import * as text from "../../../../kit/text.js";
import { StrictWarmupManifest } from "./strict-warmup-manifest.js";

/** How screens and exports show a strict warmup manifest. */
export class StrictWarmupManifestView {
  code: string;
  titleText: string;
  budgetText: string;
  region: string;
  utmSourceText: string;
  cohort: string;
  journeyIdText: string;
  version: string;
  marginText: string;
  capacityText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    budgetText: string,
    region: string,
    utmSourceText: string,
    cohort: string,
    journeyIdText: string,
    version: string,
    marginText: string,
    capacityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.budgetText = budgetText;
    this.region = region;
    this.utmSourceText = utmSourceText;
    this.cohort = cohort;
    this.journeyIdText = journeyIdText;
    this.version = version;
    this.marginText = marginText;
    this.capacityText = capacityText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictWarmupManifestView(item: StrictWarmupManifest): StrictWarmupManifestView {
  return new StrictWarmupManifestView(
    item.code,
    item.title,
    item.budget.toFixed(2),
    text.truncate(item.region, 64),
    item.utmSource,
    text.truncate(item.cohort, 40),
    item.journeyId,
    String(item.version),
    item.margin.toFixed(2),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictWarmupManifestViews(items: StrictWarmupManifest[]): StrictWarmupManifestView[] {
  const views: StrictWarmupManifestView[] = [];
  for (const item of items) {
    views.push(toStrictWarmupManifestView(item));
  }
  return views;
}

export function sumStrictWarmupManifestView(view: StrictWarmupManifestView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedBudget + parsedVersion + parsedMargin;
}
