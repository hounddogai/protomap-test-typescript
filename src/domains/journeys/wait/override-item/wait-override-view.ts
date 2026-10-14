import * as text from "../../../../kit/text.js";
import { WaitOverride } from "./wait-override.js";

/** How screens and exports show a wait override. */
export class WaitOverrideView {
  code: string;
  label: string;
  pinned: string;
  budget: string;
  sendAt: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    pinned: string,
    budget: string,
    sendAt: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.budget = budget;
    this.sendAt = sendAt;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toWaitOverrideView(item: WaitOverride): WaitOverrideView {
  return new WaitOverrideView(
    item.code,
    text.truncate(item.label, 40),
    `${item.pinned}`,
    item.budget.toFixed(2),
    String(item.sendAt),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitOverrideViews(items: WaitOverride[]): WaitOverrideView[] {
  const views: WaitOverrideView[] = [];
  for (const item of items) {
    views.push(toWaitOverrideView(item));
  }
  return views;
}

export function sumWaitOverrideView(view: WaitOverrideView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedBudget + parsedSendAt + parsedMargin;
}
