import * as text from "../../../../kit/text.js";
import { MacroQuota } from "./macro-quota.js";

/** How screens and exports show a macro quota. */
export class MacroQuotaView {
  codeText: string;
  name: string;
  retries: string;
  margin: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    retries: string,
    margin: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.retries = retries;
    this.margin = margin;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toMacroQuotaView(item: MacroQuota): MacroQuotaView {
  return new MacroQuotaView(
    item.code,
    item.name,
    String(item.retries),
    item.margin.toFixed(2),
    text.truncate(item.journeyId, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroQuotaViews(items: MacroQuota[]): MacroQuotaView[] {
  const views: MacroQuotaView[] = [];
  for (const item of items) {
    views.push(toMacroQuotaView(item));
  }
  return views;
}

export function sumMacroQuotaView(view: MacroQuotaView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedRetries + parsedMargin;
}
