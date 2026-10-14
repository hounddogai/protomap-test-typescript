import * as text from "../../../../kit/text.js";
import { GlobalSlaCycle } from "./global-sla-cycle.js";

/** How screens and exports show a global sla cycle. */
export class GlobalSlaCycleView {
  code: string;
  name: string;
  clicksText: string;
  cohortText: string;
  externalRefText: string;
  country: string;
  utmSourceText: string;
  updatedAt: string;
  ceiling: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    clicksText: string,
    cohortText: string,
    externalRefText: string,
    country: string,
    utmSourceText: string,
    updatedAt: string,
    ceiling: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.clicksText = clicksText;
    this.cohortText = cohortText;
    this.externalRefText = externalRefText;
    this.country = country;
    this.utmSourceText = utmSourceText;
    this.updatedAt = updatedAt;
    this.ceiling = ceiling;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalSlaCycleView(item: GlobalSlaCycle): GlobalSlaCycleView {
  return new GlobalSlaCycleView(
    text.truncate(item.code, 80),
    item.name,
    String(item.clicks),
    item.cohort,
    item.externalRef,
    item.country,
    item.utmSource,
    String(item.updatedAt),
    item.ceiling.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalSlaCycleViews(items: GlobalSlaCycle[]): GlobalSlaCycleView[] {
  const views: GlobalSlaCycleView[] = [];
  for (const item of items) {
    views.push(toGlobalSlaCycleView(item));
  }
  return views;
}

export function sumGlobalSlaCycleView(view: GlobalSlaCycleView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedClicks + parsedUpdatedAt + parsedCeiling;
}
