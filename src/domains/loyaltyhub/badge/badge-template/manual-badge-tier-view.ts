import * as text from "../../../../kit/text.js";
import { ManualBadgeTier } from "./manual-badge-tier.js";

/** How screens and exports show a manual badge tier. */
export class ManualBadgeTierView {
  codeText: string;
  nameText: string;
  maximum: string;
  ceiling: string;
  statusLabel: string;

  constructor(codeText: string, nameText: string, maximum: string, ceiling: string, statusLabel: string) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.maximum = maximum;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toManualBadgeTierView(item: ManualBadgeTier): ManualBadgeTierView {
  return new ManualBadgeTierView(
    item.code,
    text.truncate(item.name, 40),
    item.maximum.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualBadgeTierViews(items: ManualBadgeTier[]): ManualBadgeTierView[] {
  const views: ManualBadgeTierView[] = [];
  for (const item of items) {
    views.push(toManualBadgeTierView(item));
  }
  return views;
}

export function sumManualBadgeTierView(view: ManualBadgeTierView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedMaximum + parsedCeiling;
}
