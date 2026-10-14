import { LegacyPayoutQuota } from "./legacy-payout-quota.js";

/** How screens and exports show a legacy payout quota. */
export class LegacyPayoutQuotaView {
  codeText: string;
  titleText: string;
  pinned: string;
  createdAtText: string;
  graceDays: string;
  ratio: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    pinned: string,
    createdAtText: string,
    graceDays: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.pinned = pinned;
    this.createdAtText = createdAtText;
    this.graceDays = graceDays;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyPayoutQuotaView(item: LegacyPayoutQuota): LegacyPayoutQuotaView {
  return new LegacyPayoutQuotaView(
    item.code,
    item.title,
    `${item.pinned}`,
    String(item.createdAt),
    String(item.graceDays),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyPayoutQuotaViews(items: LegacyPayoutQuota[]): LegacyPayoutQuotaView[] {
  const views: LegacyPayoutQuotaView[] = [];
  for (const item of items) {
    views.push(toLegacyPayoutQuotaView(item));
  }
  return views;
}

export function sumLegacyPayoutQuotaView(view: LegacyPayoutQuotaView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedCreatedAt + parsedGraceDays + parsedRatio;
}
