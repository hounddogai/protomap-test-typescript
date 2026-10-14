import { AdaptiveEnrollmentQuota } from "./adaptive-enrollment-quota.js";

/** How screens and exports show a adaptive enrollment quota. */
export class AdaptiveEnrollmentQuotaView {
  code: string;
  nameText: string;
  sendAt: string;
  durationMinutes: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    sendAt: string,
    durationMinutes: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.sendAt = sendAt;
    this.durationMinutes = durationMinutes;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveEnrollmentQuotaView(item: AdaptiveEnrollmentQuota): AdaptiveEnrollmentQuotaView {
  return new AdaptiveEnrollmentQuotaView(
    item.code,
    item.name,
    String(item.sendAt),
    String(item.durationMinutes),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveEnrollmentQuotaViews(items: AdaptiveEnrollmentQuota[]): AdaptiveEnrollmentQuotaView[] {
  const views: AdaptiveEnrollmentQuotaView[] = [];
  for (const item of items) {
    views.push(toAdaptiveEnrollmentQuotaView(item));
  }
  return views;
}

export function sumAdaptiveEnrollmentQuotaView(view: AdaptiveEnrollmentQuotaView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedSendAt + parsedDurationMinutes + parsedImpressions;
}
