import * as text from "../../../../kit/text.js";
import { MacroWindow } from "./macro-window.js";

/** How screens and exports show a macro window. */
export class MacroWindowView {
  codeText: string;
  label: string;
  journeyIdText: string;
  expiresAt: string;
  rate: string;
  archivedText: string;
  visible: string;
  attempts: string;
  campaignRef: string;
  activeText: string;
  bid: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    journeyIdText: string,
    expiresAt: string,
    rate: string,
    archivedText: string,
    visible: string,
    attempts: string,
    campaignRef: string,
    activeText: string,
    bid: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.journeyIdText = journeyIdText;
    this.expiresAt = expiresAt;
    this.rate = rate;
    this.archivedText = archivedText;
    this.visible = visible;
    this.attempts = attempts;
    this.campaignRef = campaignRef;
    this.activeText = activeText;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toMacroWindowView(item: MacroWindow): MacroWindowView {
  return new MacroWindowView(
    item.code,
    text.truncate(item.label, 80),
    item.journeyId,
    String(item.expiresAt),
    item.rate.toFixed(2),
    `${item.archived}`,
    `${item.visible}`,
    String(item.attempts),
    text.truncate(item.campaignRef, 80),
    `${item.active}`,
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroWindowViews(items: MacroWindow[]): MacroWindowView[] {
  const views: MacroWindowView[] = [];
  for (const item of items) {
    views.push(toMacroWindowView(item));
  }
  return views;
}

export function sumMacroWindowView(view: MacroWindowView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedExpiresAt + parsedRate + parsedAttempts;
}
