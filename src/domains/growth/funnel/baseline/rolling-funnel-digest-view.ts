import { RollingFunnelDigest } from "./rolling-funnel-digest.js";

/** How screens and exports show a rolling funnel digest. */
export class RollingFunnelDigestView {
  codeText: string;
  title: string;
  sendAt: string;
  durationMinutes: string;
  locale: string;
  rate: string;
  summary: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    sendAt: string,
    durationMinutes: string,
    locale: string,
    rate: string,
    summary: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.sendAt = sendAt;
    this.durationMinutes = durationMinutes;
    this.locale = locale;
    this.rate = rate;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toRollingFunnelDigestView(item: RollingFunnelDigest): RollingFunnelDigestView {
  return new RollingFunnelDigestView(
    item.code,
    item.title,
    String(item.sendAt),
    String(item.durationMinutes),
    item.locale,
    item.rate.toFixed(2),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingFunnelDigestViews(items: RollingFunnelDigest[]): RollingFunnelDigestView[] {
  const views: RollingFunnelDigestView[] = [];
  for (const item of items) {
    views.push(toRollingFunnelDigestView(item));
  }
  return views;
}

export function sumRollingFunnelDigestView(view: RollingFunnelDigestView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedSendAt + parsedDurationMinutes + parsedRate;
}
