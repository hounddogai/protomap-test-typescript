import * as text from "../../../../kit/text.js";
import { TierSlot } from "./tier-slot.js";

/** How screens and exports show a tier slot. */
export class TierSlotView {
  code: string;
  labelText: string;
  timezoneText: string;
  revision: string;
  ceiling: string;
  title: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    timezoneText: string,
    revision: string,
    ceiling: string,
    title: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.timezoneText = timezoneText;
    this.revision = revision;
    this.ceiling = ceiling;
    this.title = title;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toTierSlotView(item: TierSlot): TierSlotView {
  return new TierSlotView(
    item.code,
    text.truncate(item.label, 120),
    item.timezone,
    String(item.revision),
    item.ceiling.toFixed(2),
    item.title,
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTierSlotViews(items: TierSlot[]): TierSlotView[] {
  const views: TierSlotView[] = [];
  for (const item of items) {
    views.push(toTierSlotView(item));
  }
  return views;
}

export function sumTierSlotView(view: TierSlotView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedRevision + parsedCeiling + parsedWeight;
}
