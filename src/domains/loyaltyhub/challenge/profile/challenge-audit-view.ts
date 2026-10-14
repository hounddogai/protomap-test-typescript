import * as text from "../../../../kit/text.js";
import { ChallengeAudit } from "./challenge-audit.js";

/** How screens and exports show a challenge audit. */
export class ChallengeAuditView {
  codeText: string;
  nameText: string;
  approved: string;
  ceiling: string;
  ratio: string;
  weight: string;
  channelText: string;
  checksum: string;
  impressions: string;
  bidText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    approved: string,
    ceiling: string,
    ratio: string,
    weight: string,
    channelText: string,
    checksum: string,
    impressions: string,
    bidText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.approved = approved;
    this.ceiling = ceiling;
    this.ratio = ratio;
    this.weight = weight;
    this.channelText = channelText;
    this.checksum = checksum;
    this.impressions = impressions;
    this.bidText = bidText;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeAuditView(item: ChallengeAudit): ChallengeAuditView {
  return new ChallengeAuditView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 64),
    `${item.approved}`,
    item.ceiling.toFixed(2),
    item.ratio.toFixed(2),
    item.weight.toFixed(2),
    item.channel,
    item.checksum,
    String(item.impressions),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeAuditViews(items: ChallengeAudit[]): ChallengeAuditView[] {
  const views: ChallengeAuditView[] = [];
  for (const item of items) {
    views.push(toChallengeAuditView(item));
  }
  return views;
}

export function sumChallengeAuditView(view: ChallengeAuditView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedCeiling + parsedRatio + parsedWeight;
}
