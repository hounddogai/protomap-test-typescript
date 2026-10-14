import { AdaptiveRetentionPreference } from "./adaptive-retention-preference.js";

/** How screens and exports show a adaptive retention preference. */
export class AdaptiveRetentionPreferenceView {
  code: string;
  label: string;
  sendAt: string;
  limitText: string;
  sequence: string;
  durationMinutes: string;
  description: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    sendAt: string,
    limitText: string,
    sequence: string,
    durationMinutes: string,
    description: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.limitText = limitText;
    this.sequence = sequence;
    this.durationMinutes = durationMinutes;
    this.description = description;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveRetentionPreferenceView(item: AdaptiveRetentionPreference): AdaptiveRetentionPreferenceView {
  return new AdaptiveRetentionPreferenceView(
    item.code,
    item.label,
    String(item.sendAt),
    String(item.limit),
    String(item.sequence),
    String(item.durationMinutes),
    item.description,
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveRetentionPreferenceViews(items: AdaptiveRetentionPreference[]): AdaptiveRetentionPreferenceView[] {
  const views: AdaptiveRetentionPreferenceView[] = [];
  for (const item of items) {
    views.push(toAdaptiveRetentionPreferenceView(item));
  }
  return views;
}

export function sumAdaptiveRetentionPreferenceView(view: AdaptiveRetentionPreferenceView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedSendAt + parsedLimit + parsedSequence;
}
