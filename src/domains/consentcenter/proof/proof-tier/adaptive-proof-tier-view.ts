import * as text from "../../../../kit/text.js";
import { AdaptiveProofTier } from "./adaptive-proof-tier.js";

/** How screens and exports show a adaptive proof tier. */
export class AdaptiveProofTierView {
  code: string;
  label: string;
  channelText: string;
  audienceId: string;
  variantText: string;
  visible: string;
  weight: string;
  retries: string;
  notes: string;
  durationMinutes: string;
  ratioText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    channelText: string,
    audienceId: string,
    variantText: string,
    visible: string,
    weight: string,
    retries: string,
    notes: string,
    durationMinutes: string,
    ratioText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.channelText = channelText;
    this.audienceId = audienceId;
    this.variantText = variantText;
    this.visible = visible;
    this.weight = weight;
    this.retries = retries;
    this.notes = notes;
    this.durationMinutes = durationMinutes;
    this.ratioText = ratioText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveProofTierView(item: AdaptiveProofTier): AdaptiveProofTierView {
  return new AdaptiveProofTierView(
    item.code,
    item.label,
    item.channel,
    item.audienceId,
    text.truncate(item.variant, 80),
    `${item.visible}`,
    item.weight.toFixed(2),
    String(item.retries),
    item.notes,
    String(item.durationMinutes),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveProofTierViews(items: AdaptiveProofTier[]): AdaptiveProofTierView[] {
  const views: AdaptiveProofTierView[] = [];
  for (const item of items) {
    views.push(toAdaptiveProofTierView(item));
  }
  return views;
}

export function sumAdaptiveProofTierView(view: AdaptiveProofTierView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedWeight + parsedRetries + parsedDurationMinutes;
}
