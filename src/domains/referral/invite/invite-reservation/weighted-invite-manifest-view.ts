import * as text from "../../../../kit/text.js";
import { WeightedInviteManifest } from "./weighted-invite-manifest.js";

/** How screens and exports show a weighted invite manifest. */
export class WeightedInviteManifestView {
  code: string;
  name: string;
  ratioText: string;
  locale: string;
  title: string;
  statusLabel: string;

  constructor(code: string, name: string, ratioText: string, locale: string, title: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.ratioText = ratioText;
    this.locale = locale;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedInviteManifestView(item: WeightedInviteManifest): WeightedInviteManifestView {
  return new WeightedInviteManifestView(
    text.truncate(item.code, 40),
    item.name,
    item.ratio.toFixed(2),
    item.locale,
    item.title,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedInviteManifestViews(items: WeightedInviteManifest[]): WeightedInviteManifestView[] {
  const views: WeightedInviteManifestView[] = [];
  for (const item of items) {
    views.push(toWeightedInviteManifestView(item));
  }
  return views;
}

export function sumWeightedInviteManifestView(view: WeightedInviteManifestView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedRatio;
}
