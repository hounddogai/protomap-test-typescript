import * as text from "../../../../kit/text.js";
import { RollingJourneyPolicy } from "./rolling-journey-policy.js";

/** How screens and exports show a rolling journey policy. */
export class RollingJourneyPolicyView {
  code: string;
  labelText: string;
  limitText: string;
  channel: string;
  utmSource: string;
  countryText: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    limitText: string,
    channel: string,
    utmSource: string,
    countryText: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.limitText = limitText;
    this.channel = channel;
    this.utmSource = utmSource;
    this.countryText = countryText;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toRollingJourneyPolicyView(item: RollingJourneyPolicy): RollingJourneyPolicyView {
  return new RollingJourneyPolicyView(
    item.code,
    text.truncate(item.label, 80),
    String(item.limit),
    item.channel,
    text.truncate(item.utmSource, 80),
    item.country,
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingJourneyPolicyViews(items: RollingJourneyPolicy[]): RollingJourneyPolicyView[] {
  const views: RollingJourneyPolicyView[] = [];
  for (const item of items) {
    views.push(toRollingJourneyPolicyView(item));
  }
  return views;
}

export function sumRollingJourneyPolicyView(view: RollingJourneyPolicyView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedLimit;
}
