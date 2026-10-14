import * as text from "../../../../kit/text.js";
import { PrimaryCsatManifest } from "./primary-csat-manifest.js";

/** How screens and exports show a primary csat manifest. */
export class PrimaryCsatManifestView {
  code: string;
  name: string;
  revision: string;
  retries: string;
  maximumText: string;
  budgetText: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    revision: string,
    retries: string,
    maximumText: string,
    budgetText: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.retries = retries;
    this.maximumText = maximumText;
    this.budgetText = budgetText;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryCsatManifestView(item: PrimaryCsatManifest): PrimaryCsatManifestView {
  return new PrimaryCsatManifestView(
    item.code,
    text.truncate(item.name, 80),
    String(item.revision),
    String(item.retries),
    item.maximum.toFixed(2),
    item.budget.toFixed(2),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryCsatManifestViews(items: PrimaryCsatManifest[]): PrimaryCsatManifestView[] {
  const views: PrimaryCsatManifestView[] = [];
  for (const item of items) {
    views.push(toPrimaryCsatManifestView(item));
  }
  return views;
}

export function sumPrimaryCsatManifestView(view: PrimaryCsatManifestView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  return parsedRevision + parsedRetries + parsedMaximum;
}
