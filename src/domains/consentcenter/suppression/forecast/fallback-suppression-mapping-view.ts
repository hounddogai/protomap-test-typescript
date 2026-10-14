import { FallbackSuppressionMapping } from "./fallback-suppression-mapping.js";

/** How screens and exports show a fallback suppression mapping. */
export class FallbackSuppressionMappingView {
  code: string;
  labelText: string;
  budget: string;
  startsAt: string;
  archived: string;
  floorValueText: string;
  sourceText: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    budget: string,
    startsAt: string,
    archived: string,
    floorValueText: string,
    sourceText: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.budget = budget;
    this.startsAt = startsAt;
    this.archived = archived;
    this.floorValueText = floorValueText;
    this.sourceText = sourceText;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackSuppressionMappingView(item: FallbackSuppressionMapping): FallbackSuppressionMappingView {
  return new FallbackSuppressionMappingView(
    item.code,
    item.label,
    item.budget.toFixed(2),
    String(item.startsAt),
    `${item.archived}`,
    item.floorValue.toFixed(2),
    item.source,
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackSuppressionMappingViews(items: FallbackSuppressionMapping[]): FallbackSuppressionMappingView[] {
  const views: FallbackSuppressionMappingView[] = [];
  for (const item of items) {
    views.push(toFallbackSuppressionMappingView(item));
  }
  return views;
}

export function sumFallbackSuppressionMappingView(view: FallbackSuppressionMappingView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedBudget + parsedStartsAt + parsedFloorValue;
}
