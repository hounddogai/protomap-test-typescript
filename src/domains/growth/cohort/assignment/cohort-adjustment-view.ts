import { CohortAdjustment } from "./cohort-adjustment.js";

/** How screens and exports show a cohort adjustment. */
export class CohortAdjustmentView {
  code: string;
  name: string;
  revisionText: string;
  openRateText: string;
  countryText: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    revisionText: string,
    openRateText: string,
    countryText: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.revisionText = revisionText;
    this.openRateText = openRateText;
    this.countryText = countryText;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toCohortAdjustmentView(item: CohortAdjustment): CohortAdjustmentView {
  return new CohortAdjustmentView(
    item.code,
    item.name,
    String(item.revision),
    item.openRate.toFixed(2),
    item.country,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortAdjustmentViews(items: CohortAdjustment[]): CohortAdjustmentView[] {
  const views: CohortAdjustmentView[] = [];
  for (const item of items) {
    views.push(toCohortAdjustmentView(item));
  }
  return views;
}

export function sumCohortAdjustmentView(view: CohortAdjustmentView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedRevision + parsedOpenRate + parsedVersion;
}
