import * as text from "../../../../kit/text.js";
import { RollingCsatProfile } from "./rolling-csat-profile.js";

/** How screens and exports show a rolling csat profile. */
export class RollingCsatProfileView {
  code: string;
  label: string;
  source: string;
  startsAtText: string;
  minimum: string;
  category: string;
  revision: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    source: string,
    startsAtText: string,
    minimum: string,
    category: string,
    revision: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.startsAtText = startsAtText;
    this.minimum = minimum;
    this.category = category;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toRollingCsatProfileView(item: RollingCsatProfile): RollingCsatProfileView {
  return new RollingCsatProfileView(
    text.truncate(item.code, 80),
    item.label,
    item.source,
    String(item.startsAt),
    item.minimum.toFixed(2),
    item.category,
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingCsatProfileViews(items: RollingCsatProfile[]): RollingCsatProfileView[] {
  const views: RollingCsatProfileView[] = [];
  for (const item of items) {
    views.push(toRollingCsatProfileView(item));
  }
  return views;
}

export function sumRollingCsatProfileView(view: RollingCsatProfileView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedStartsAt + parsedMinimum + parsedRevision;
}
