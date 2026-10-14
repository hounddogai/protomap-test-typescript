import * as text from "../../../../kit/text.js";
import { PaywallManifest } from "./paywall-manifest.js";

/** How screens and exports show a paywall manifest. */
export class PaywallManifestView {
  code: string;
  name: string;
  timezone: string;
  sendAt: string;
  audienceIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    timezone: string,
    sendAt: string,
    audienceIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.sendAt = sendAt;
    this.audienceIdText = audienceIdText;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallManifestView(item: PaywallManifest): PaywallManifestView {
  return new PaywallManifestView(
    item.code,
    item.name,
    text.truncate(item.timezone, 120),
    String(item.sendAt),
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallManifestViews(items: PaywallManifest[]): PaywallManifestView[] {
  const views: PaywallManifestView[] = [];
  for (const item of items) {
    views.push(toPaywallManifestView(item));
  }
  return views;
}

export function sumPaywallManifestView(view: PaywallManifestView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedSendAt;
}
