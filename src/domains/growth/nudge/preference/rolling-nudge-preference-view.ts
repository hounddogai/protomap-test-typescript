import * as text from "../../../../kit/text.js";
import { RollingNudgePreference } from "./rolling-nudge-preference.js";

/** How screens and exports show a rolling nudge preference. */
export class RollingNudgePreferenceView {
  code: string;
  label: string;
  utmSource: string;
  quantity: string;
  createdAt: string;
  unitText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    quantity: string,
    createdAt: string,
    unitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.quantity = quantity;
    this.createdAt = createdAt;
    this.unitText = unitText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingNudgePreferenceView(item: RollingNudgePreference): RollingNudgePreferenceView {
  return new RollingNudgePreferenceView(
    item.code,
    text.truncate(item.label, 40),
    item.utmSource,
    String(item.quantity),
    String(item.createdAt),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingNudgePreferenceViews(items: RollingNudgePreference[]): RollingNudgePreferenceView[] {
  const views: RollingNudgePreferenceView[] = [];
  for (const item of items) {
    views.push(toRollingNudgePreferenceView(item));
  }
  return views;
}

export function sumRollingNudgePreferenceView(view: RollingNudgePreferenceView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedQuantity + parsedCreatedAt;
}
