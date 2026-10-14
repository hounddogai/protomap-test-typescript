import * as text from "../../../../kit/text.js";
import { CappedChallengeClaim } from "./capped-challenge-claim.js";

/** How screens and exports show a capped challenge claim. */
export class CappedChallengeClaimView {
  code: string;
  nameText: string;
  country: string;
  scoreText: string;
  checksum: string;
  currency: string;
  label: string;
  expiresAt: string;
  sendAt: string;
  unitText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    country: string,
    scoreText: string,
    checksum: string,
    currency: string,
    label: string,
    expiresAt: string,
    sendAt: string,
    unitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.country = country;
    this.scoreText = scoreText;
    this.checksum = checksum;
    this.currency = currency;
    this.label = label;
    this.expiresAt = expiresAt;
    this.sendAt = sendAt;
    this.unitText = unitText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedChallengeClaimView(item: CappedChallengeClaim): CappedChallengeClaimView {
  return new CappedChallengeClaimView(
    text.truncate(item.code, 64),
    item.name,
    item.country,
    item.score.toFixed(2),
    item.checksum,
    item.currency,
    item.label,
    String(item.expiresAt),
    String(item.sendAt),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedChallengeClaimViews(items: CappedChallengeClaim[]): CappedChallengeClaimView[] {
  const views: CappedChallengeClaimView[] = [];
  for (const item of items) {
    views.push(toCappedChallengeClaimView(item));
  }
  return views;
}

export function sumCappedChallengeClaimView(view: CappedChallengeClaimView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedScore + parsedExpiresAt + parsedSendAt;
}
