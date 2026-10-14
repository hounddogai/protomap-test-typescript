import * as text from "../../../../kit/text.js";
import { PreferencePolicy } from "./preference-policy.js";

/** How screens and exports show a preference policy. */
export class PreferencePolicyView {
  code: string;
  name: string;
  currency: string;
  attempts: string;
  description: string;
  margin: string;
  journeyId: string;
  channel: string;
  sendAt: string;
  timezone: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    currency: string,
    attempts: string,
    description: string,
    margin: string,
    journeyId: string,
    channel: string,
    sendAt: string,
    timezone: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.attempts = attempts;
    this.description = description;
    this.margin = margin;
    this.journeyId = journeyId;
    this.channel = channel;
    this.sendAt = sendAt;
    this.timezone = timezone;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toPreferencePolicyView(item: PreferencePolicy): PreferencePolicyView {
  return new PreferencePolicyView(
    item.code,
    text.truncate(item.name, 80),
    text.truncate(item.currency, 40),
    String(item.attempts),
    text.truncate(item.description, 80),
    item.margin.toFixed(2),
    item.journeyId,
    text.truncate(item.channel, 40),
    String(item.sendAt),
    item.timezone,
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferencePolicyViews(items: PreferencePolicy[]): PreferencePolicyView[] {
  const views: PreferencePolicyView[] = [];
  for (const item of items) {
    views.push(toPreferencePolicyView(item));
  }
  return views;
}

export function sumPreferencePolicyView(view: PreferencePolicyView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedAttempts + parsedMargin + parsedSendAt;
}
