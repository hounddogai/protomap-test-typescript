import * as text from "../../../../kit/text.js";
import { SeasonalDoubleOptInSlot } from "./seasonal-double-opt-in-slot.js";

/** How screens and exports show a seasonal double opt in slot. */
export class SeasonalDoubleOptInSlotView {
  code: string;
  name: string;
  archived: string;
  graceDays: string;
  phoneText: string;
  endsAt: string;
  audienceIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    archived: string,
    graceDays: string,
    phoneText: string,
    endsAt: string,
    audienceIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.graceDays = graceDays;
    this.phoneText = phoneText;
    this.endsAt = endsAt;
    this.audienceIdText = audienceIdText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalDoubleOptInSlotView(item: SeasonalDoubleOptInSlot): SeasonalDoubleOptInSlotView {
  return new SeasonalDoubleOptInSlotView(
    item.code,
    item.name,
    `${item.archived}`,
    String(item.graceDays),
    item.phone,
    String(item.endsAt),
    text.truncate(item.audienceId, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalDoubleOptInSlotViews(items: SeasonalDoubleOptInSlot[]): SeasonalDoubleOptInSlotView[] {
  const views: SeasonalDoubleOptInSlotView[] = [];
  for (const item of items) {
    views.push(toSeasonalDoubleOptInSlotView(item));
  }
  return views;
}

export function sumSeasonalDoubleOptInSlotView(view: SeasonalDoubleOptInSlotView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedGraceDays + parsedEndsAt;
}
