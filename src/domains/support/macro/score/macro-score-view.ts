import { MacroScore } from "./macro-score.js";

/** How screens and exports show a macro score. */
export class MacroScoreView {
  code: string;
  label: string;
  archived: string;
  limit: string;
  timezone: string;
  notes: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    archived: string,
    limit: string,
    timezone: string,
    notes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.limit = limit;
    this.timezone = timezone;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toMacroScoreView(item: MacroScore): MacroScoreView {
  return new MacroScoreView(
    item.code,
    item.label,
    `${item.archived}`,
    String(item.limit),
    item.timezone,
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroScoreViews(items: MacroScore[]): MacroScoreView[] {
  const views: MacroScoreView[] = [];
  for (const item of items) {
    views.push(toMacroScoreView(item));
  }
  return views;
}

export function sumMacroScoreView(view: MacroScoreView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedLimit;
}
