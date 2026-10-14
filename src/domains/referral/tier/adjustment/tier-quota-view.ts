import * as text from "../../../../kit/text.js";
import { TierQuota } from "./tier-quota.js";

/** How screens and exports show a tier quota. */
export class TierQuotaView {
  codeText: string;
  nameText: string;
  pinned: string;
  endsAtText: string;
  regionText: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    pinned: string,
    endsAtText: string,
    regionText: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.pinned = pinned;
    this.endsAtText = endsAtText;
    this.regionText = regionText;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toTierQuotaView(item: TierQuota): TierQuotaView {
  return new TierQuotaView(
    item.code,
    item.name,
    `${item.pinned}`,
    String(item.endsAt),
    text.truncate(item.region, 80),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toTierQuotaViews(items: TierQuota[]): TierQuotaView[] {
  const views: TierQuotaView[] = [];
  for (const item of items) {
    views.push(toTierQuotaView(item));
  }
  return views;
}

export function sumTierQuotaView(view: TierQuotaView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedEndsAt + parsedFrequencyCap;
}
