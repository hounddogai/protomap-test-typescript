import * as text from "../../../../kit/text.js";
import { TieredFunnelMapping } from "./tiered-funnel-mapping.js";

/** How screens and exports show a tiered funnel mapping. */
export class TieredFunnelMappingView {
  code: string;
  name: string;
  cohort: string;
  revision: string;
  startsAt: string;
  reviewer: string;
  budget: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    cohort: string,
    revision: string,
    startsAt: string,
    reviewer: string,
    budget: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.revision = revision;
    this.startsAt = startsAt;
    this.reviewer = reviewer;
    this.budget = budget;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toTieredFunnelMappingView(item: TieredFunnelMapping): TieredFunnelMappingView {
  return new TieredFunnelMappingView(
    item.code,
    item.name,
    item.cohort,
    String(item.revision),
    String(item.startsAt),
    text.truncate(item.reviewer, 64),
    item.budget.toFixed(2),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredFunnelMappingViews(items: TieredFunnelMapping[]): TieredFunnelMappingView[] {
  const views: TieredFunnelMappingView[] = [];
  for (const item of items) {
    views.push(toTieredFunnelMappingView(item));
  }
  return views;
}

export function sumTieredFunnelMappingView(view: TieredFunnelMappingView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedRevision + parsedStartsAt + parsedBudget;
}
