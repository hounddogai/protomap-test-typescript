import { LegacyLeaderboardQuota } from "./legacy-leaderboard-quota.js";

/** How screens and exports show a legacy leaderboard quota. */
export class LegacyLeaderboardQuotaView {
  codeText: string;
  name: string;
  graceDays: string;
  createdAtText: string;
  currencyText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    graceDays: string,
    createdAtText: string,
    currencyText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.graceDays = graceDays;
    this.createdAtText = createdAtText;
    this.currencyText = currencyText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyLeaderboardQuotaView(item: LegacyLeaderboardQuota): LegacyLeaderboardQuotaView {
  return new LegacyLeaderboardQuotaView(
    item.code,
    item.name,
    String(item.graceDays),
    String(item.createdAt),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyLeaderboardQuotaViews(items: LegacyLeaderboardQuota[]): LegacyLeaderboardQuotaView[] {
  const views: LegacyLeaderboardQuotaView[] = [];
  for (const item of items) {
    views.push(toLegacyLeaderboardQuotaView(item));
  }
  return views;
}

export function sumLegacyLeaderboardQuotaView(view: LegacyLeaderboardQuotaView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedGraceDays + parsedCreatedAt;
}
