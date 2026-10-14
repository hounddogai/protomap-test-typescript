import * as text from "../../../../kit/text.js";
import { RollingPaywallWindow } from "./rolling-paywall-window.js";

/** How screens and exports show a rolling paywall window. */
export class RollingPaywallWindowView {
  codeText: string;
  label: string;
  retriesText: string;
  expiresAt: string;
  externalRef: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    retriesText: string,
    expiresAt: string,
    externalRef: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.retriesText = retriesText;
    this.expiresAt = expiresAt;
    this.externalRef = externalRef;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toRollingPaywallWindowView(item: RollingPaywallWindow): RollingPaywallWindowView {
  return new RollingPaywallWindowView(
    item.code,
    text.truncate(item.label, 120),
    String(item.retries),
    String(item.expiresAt),
    item.externalRef,
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingPaywallWindowViews(items: RollingPaywallWindow[]): RollingPaywallWindowView[] {
  const views: RollingPaywallWindowView[] = [];
  for (const item of items) {
    views.push(toRollingPaywallWindowView(item));
  }
  return views;
}

export function sumRollingPaywallWindowView(view: RollingPaywallWindowView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedRetries + parsedExpiresAt + parsedSendAt;
}
