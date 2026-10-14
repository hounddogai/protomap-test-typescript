import * as text from "../../../../kit/text.js";
import { MacroAdjustment } from "./macro-adjustment.js";

/** How screens and exports show a macro adjustment. */
export class MacroAdjustmentView {
  codeText: string;
  title: string;
  variantText: string;
  margin: string;
  description: string;
  summary: string;
  utmSource: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    variantText: string,
    margin: string,
    description: string,
    summary: string,
    utmSource: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.variantText = variantText;
    this.margin = margin;
    this.description = description;
    this.summary = summary;
    this.utmSource = utmSource;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toMacroAdjustmentView(item: MacroAdjustment): MacroAdjustmentView {
  return new MacroAdjustmentView(
    item.code,
    item.title,
    item.variant,
    item.margin.toFixed(2),
    item.description,
    item.summary,
    text.truncate(item.utmSource, 80),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroAdjustmentViews(items: MacroAdjustment[]): MacroAdjustmentView[] {
  const views: MacroAdjustmentView[] = [];
  for (const item of items) {
    views.push(toMacroAdjustmentView(item));
  }
  return views;
}

export function sumMacroAdjustmentView(view: MacroAdjustmentView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedMargin + parsedEndsAt;
}
