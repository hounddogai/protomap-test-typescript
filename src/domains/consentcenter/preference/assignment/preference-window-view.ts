import * as text from "../../../../kit/text.js";
import { PreferenceWindow } from "./preference-window.js";

/** How screens and exports show a preference window. */
export class PreferenceWindowView {
  code: string;
  label: string;
  startsAt: string;
  phoneText: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    startsAt: string,
    phoneText: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.phoneText = phoneText;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceWindowView(item: PreferenceWindow): PreferenceWindowView {
  return new PreferenceWindowView(
    text.truncate(item.code, 80),
    item.label,
    String(item.startsAt),
    item.phone,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceWindowViews(items: PreferenceWindow[]): PreferenceWindowView[] {
  const views: PreferenceWindowView[] = [];
  for (const item of items) {
    views.push(toPreferenceWindowView(item));
  }
  return views;
}

export function sumPreferenceWindowView(view: PreferenceWindowView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedStartsAt + parsedVersion;
}
