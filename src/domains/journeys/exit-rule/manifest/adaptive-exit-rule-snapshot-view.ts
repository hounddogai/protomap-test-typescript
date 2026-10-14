import * as text from "../../../../kit/text.js";
import { AdaptiveExitRuleSnapshot } from "./adaptive-exit-rule-snapshot.js";

/** How screens and exports show a adaptive exit rule snapshot. */
export class AdaptiveExitRuleSnapshotView {
  code: string;
  labelText: string;
  contactEmail: string;
  countryText: string;
  source: string;
  audienceId: string;
  description: string;
  marginText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    contactEmail: string,
    countryText: string,
    source: string,
    audienceId: string,
    description: string,
    marginText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.contactEmail = contactEmail;
    this.countryText = countryText;
    this.source = source;
    this.audienceId = audienceId;
    this.description = description;
    this.marginText = marginText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveExitRuleSnapshotView(item: AdaptiveExitRuleSnapshot): AdaptiveExitRuleSnapshotView {
  return new AdaptiveExitRuleSnapshotView(
    text.truncate(item.code, 80),
    item.label,
    text.truncate(item.contactEmail, 120),
    text.truncate(item.country, 120),
    text.truncate(item.source, 120),
    item.audienceId,
    item.description,
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveExitRuleSnapshotViews(items: AdaptiveExitRuleSnapshot[]): AdaptiveExitRuleSnapshotView[] {
  const views: AdaptiveExitRuleSnapshotView[] = [];
  for (const item of items) {
    views.push(toAdaptiveExitRuleSnapshotView(item));
  }
  return views;
}

export function sumAdaptiveExitRuleSnapshotView(view: AdaptiveExitRuleSnapshotView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedMargin;
}
