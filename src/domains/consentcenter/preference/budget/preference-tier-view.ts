import * as text from "../../../../kit/text.js";
import { PreferenceTier } from "./preference-tier.js";

/** How screens and exports show a preference tier. */
export class PreferenceTierView {
  code: string;
  label: string;
  startsAtText: string;
  revision: string;
  ratio: string;
  windowDays: string;
  segmentText: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    startsAtText: string,
    revision: string,
    ratio: string,
    windowDays: string,
    segmentText: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.startsAtText = startsAtText;
    this.revision = revision;
    this.ratio = ratio;
    this.windowDays = windowDays;
    this.segmentText = segmentText;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceTierView(item: PreferenceTier): PreferenceTierView {
  return new PreferenceTierView(
    text.truncate(item.code, 80),
    item.label,
    String(item.startsAt),
    String(item.revision),
    item.ratio.toFixed(2),
    String(item.windowDays),
    text.truncate(item.segment, 80),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceTierViews(items: PreferenceTier[]): PreferenceTierView[] {
  const views: PreferenceTierView[] = [];
  for (const item of items) {
    views.push(toPreferenceTierView(item));
  }
  return views;
}

export function sumPreferenceTierView(view: PreferenceTierView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedStartsAt + parsedRevision + parsedRatio;
}
