import * as text from "../../../../kit/text.js";
import { MacroSlot } from "./macro-slot.js";

/** How screens and exports show a macro slot. */
export class MacroSlotView {
  code: string;
  labelText: string;
  revision: string;
  cohort: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    revision: string,
    cohort: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.revision = revision;
    this.cohort = cohort;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toMacroSlotView(item: MacroSlot): MacroSlotView {
  return new MacroSlotView(
    item.code,
    item.label,
    String(item.revision),
    text.truncate(item.cohort, 120),
    text.truncate(item.channel, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroSlotViews(items: MacroSlot[]): MacroSlotView[] {
  const views: MacroSlotView[] = [];
  for (const item of items) {
    views.push(toMacroSlotView(item));
  }
  return views;
}

export function sumMacroSlotView(view: MacroSlotView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedRevision;
}
