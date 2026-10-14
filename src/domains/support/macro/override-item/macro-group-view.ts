import * as text from "../../../../kit/text.js";
import { MacroGroup } from "./macro-group.js";

/** How screens and exports show a macro group. */
export class MacroGroupView {
  code: string;
  name: string;
  active: string;
  frequencyCap: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    active: string,
    frequencyCap: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.frequencyCap = frequencyCap;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toMacroGroupView(item: MacroGroup): MacroGroupView {
  return new MacroGroupView(
    text.truncate(item.code, 80),
    item.name,
    `${item.active}`,
    String(item.frequencyCap),
    text.truncate(item.description, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroGroupViews(items: MacroGroup[]): MacroGroupView[] {
  const views: MacroGroupView[] = [];
  for (const item of items) {
    views.push(toMacroGroupView(item));
  }
  return views;
}

export function sumMacroGroupView(view: MacroGroupView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedFrequencyCap;
}
