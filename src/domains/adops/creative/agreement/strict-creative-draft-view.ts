import * as text from "../../../../kit/text.js";
import { StrictCreativeDraft } from "./strict-creative-draft.js";

/** How screens and exports show a strict creative draft. */
export class StrictCreativeDraftView {
  code: string;
  nameText: string;
  startsAt: string;
  maximumText: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    startsAt: string,
    maximumText: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.startsAt = startsAt;
    this.maximumText = maximumText;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toStrictCreativeDraftView(item: StrictCreativeDraft): StrictCreativeDraftView {
  return new StrictCreativeDraftView(
    text.truncate(item.code, 64),
    item.name,
    String(item.startsAt),
    item.maximum.toFixed(2),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictCreativeDraftViews(items: StrictCreativeDraft[]): StrictCreativeDraftView[] {
  const views: StrictCreativeDraftView[] = [];
  for (const item of items) {
    views.push(toStrictCreativeDraftView(item));
  }
  return views;
}

export function sumStrictCreativeDraftView(view: StrictCreativeDraftView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedStartsAt + parsedMaximum + parsedOpenRate;
}
