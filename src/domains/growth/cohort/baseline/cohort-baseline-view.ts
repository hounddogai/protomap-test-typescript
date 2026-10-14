import * as text from "../../../../kit/text.js";
import { CohortBaseline } from "./cohort-baseline.js";

/** How screens and exports show a cohort baseline. */
export class CohortBaselineView {
  codeText: string;
  title: string;
  region: string;
  locale: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    region: string,
    locale: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.region = region;
    this.locale = locale;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toCohortBaselineView(item: CohortBaseline): CohortBaselineView {
  return new CohortBaselineView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 40),
    text.truncate(item.region, 80),
    item.locale,
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortBaselineViews(items: CohortBaseline[]): CohortBaselineView[] {
  const views: CohortBaselineView[] = [];
  for (const item of items) {
    views.push(toCohortBaselineView(item));
  }
  return views;
}

export function sumCohortBaselineView(view: CohortBaselineView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedFloorValue;
}
