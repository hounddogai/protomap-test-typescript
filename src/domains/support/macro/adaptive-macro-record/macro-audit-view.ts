import * as text from "../../../../kit/text.js";
import { MacroAudit } from "./macro-audit.js";

/** How screens and exports show a macro audit. */
export class MacroAuditView {
  code: string;
  label: string;
  channel: string;
  archived: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    channel: string,
    archived: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.archived = archived;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toMacroAuditView(item: MacroAudit): MacroAuditView {
  return new MacroAuditView(
    text.truncate(item.code, 64),
    item.label,
    item.channel,
    `${item.archived}`,
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroAuditViews(items: MacroAudit[]): MacroAuditView[] {
  const views: MacroAuditView[] = [];
  for (const item of items) {
    views.push(toMacroAuditView(item));
  }
  return views;
}

export function sumMacroAuditView(view: MacroAuditView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedConversionRate;
}
