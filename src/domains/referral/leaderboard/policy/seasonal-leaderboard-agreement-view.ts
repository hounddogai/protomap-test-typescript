import { SeasonalLeaderboardAgreement } from "./seasonal-leaderboard-agreement.js";

/** How screens and exports show a seasonal leaderboard agreement. */
export class SeasonalLeaderboardAgreementView {
  codeText: string;
  nameText: string;
  maximum: string;
  cohortText: string;
  bid: string;
  sendAtText: string;
  active: string;
  batchSizeText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    maximum: string,
    cohortText: string,
    bid: string,
    sendAtText: string,
    active: string,
    batchSizeText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.maximum = maximum;
    this.cohortText = cohortText;
    this.bid = bid;
    this.sendAtText = sendAtText;
    this.active = active;
    this.batchSizeText = batchSizeText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalLeaderboardAgreementView(item: SeasonalLeaderboardAgreement): SeasonalLeaderboardAgreementView {
  return new SeasonalLeaderboardAgreementView(
    item.code,
    item.name,
    item.maximum.toFixed(2),
    item.cohort,
    item.bid.toFixed(2),
    String(item.sendAt),
    `${item.active}`,
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalLeaderboardAgreementViews(items: SeasonalLeaderboardAgreement[]): SeasonalLeaderboardAgreementView[] {
  const views: SeasonalLeaderboardAgreementView[] = [];
  for (const item of items) {
    views.push(toSeasonalLeaderboardAgreementView(item));
  }
  return views;
}

export function sumSeasonalLeaderboardAgreementView(view: SeasonalLeaderboardAgreementView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedMaximum + parsedBid + parsedSendAt;
}
