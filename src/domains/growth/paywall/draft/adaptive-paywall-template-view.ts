import * as text from "../../../../kit/text.js";
import { AdaptivePaywallTemplate } from "./adaptive-paywall-template.js";

/** How screens and exports show a adaptive paywall template. */
export class AdaptivePaywallTemplateView {
  code: string;
  nameText: string;
  attempts: string;
  sendAt: string;
  locale: string;
  startsAt: string;
  title: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    attempts: string,
    sendAt: string,
    locale: string,
    startsAt: string,
    title: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.attempts = attempts;
    this.sendAt = sendAt;
    this.locale = locale;
    this.startsAt = startsAt;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptivePaywallTemplateView(item: AdaptivePaywallTemplate): AdaptivePaywallTemplateView {
  return new AdaptivePaywallTemplateView(
    text.truncate(item.code, 120),
    item.name,
    String(item.attempts),
    String(item.sendAt),
    text.truncate(item.locale, 80),
    String(item.startsAt),
    text.truncate(item.title, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptivePaywallTemplateViews(items: AdaptivePaywallTemplate[]): AdaptivePaywallTemplateView[] {
  const views: AdaptivePaywallTemplateView[] = [];
  for (const item of items) {
    views.push(toAdaptivePaywallTemplateView(item));
  }
  return views;
}

export function sumAdaptivePaywallTemplateView(view: AdaptivePaywallTemplateView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedAttempts + parsedSendAt + parsedStartsAt;
}
