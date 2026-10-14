import * as text from "../../../../kit/text.js";
import { InviteOverride } from "./invite-override.js";

/** How screens and exports show a invite override. */
export class InviteOverrideView {
  code: string;
  name: string;
  attempts: string;
  segment: string;
  currencyText: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    attempts: string,
    segment: string,
    currencyText: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.segment = segment;
    this.currencyText = currencyText;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toInviteOverrideView(item: InviteOverride): InviteOverrideView {
  return new InviteOverrideView(
    item.code,
    text.truncate(item.name, 64),
    String(item.attempts),
    item.segment,
    text.truncate(item.currency, 80),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteOverrideViews(items: InviteOverride[]): InviteOverrideView[] {
  const views: InviteOverrideView[] = [];
  for (const item of items) {
    views.push(toInviteOverrideView(item));
  }
  return views;
}

export function sumInviteOverrideView(view: InviteOverrideView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedAttempts + parsedFloorValue;
}
