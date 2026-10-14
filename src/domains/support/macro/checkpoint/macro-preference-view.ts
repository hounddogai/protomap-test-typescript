import * as text from "../../../../kit/text.js";
import { MacroPreference } from "./macro-preference.js";

/** How screens and exports show a macro preference. */
export class MacroPreferenceView {
  codeText: string;
  label: string;
  bid: string;
  visibleText: string;
  minimum: string;
  name: string;
  approved: string;
  activeText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    bid: string,
    visibleText: string,
    minimum: string,
    name: string,
    approved: string,
    activeText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.bid = bid;
    this.visibleText = visibleText;
    this.minimum = minimum;
    this.name = name;
    this.approved = approved;
    this.activeText = activeText;
    this.statusLabel = statusLabel;
  }
}

export function toMacroPreferenceView(item: MacroPreference): MacroPreferenceView {
  return new MacroPreferenceView(
    text.truncate(item.code, 64),
    item.label,
    item.bid.toFixed(2),
    `${item.visible}`,
    item.minimum.toFixed(2),
    item.name,
    `${item.approved}`,
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroPreferenceViews(items: MacroPreference[]): MacroPreferenceView[] {
  const views: MacroPreferenceView[] = [];
  for (const item of items) {
    views.push(toMacroPreferenceView(item));
  }
  return views;
}

export function sumMacroPreferenceView(view: MacroPreferenceView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedBid + parsedMinimum;
}
