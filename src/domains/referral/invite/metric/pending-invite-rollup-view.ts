import * as text from "../../../../kit/text.js";
import { PendingInviteRollup } from "./pending-invite-rollup.js";

/** How screens and exports show a pending invite rollup. */
export class PendingInviteRollupView {
  code: string;
  title: string;
  ceiling: string;
  scoreText: string;
  graceDays: string;
  nameText: string;
  discount: string;
  externalRef: string;
  campaignRef: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    ceiling: string,
    scoreText: string,
    graceDays: string,
    nameText: string,
    discount: string,
    externalRef: string,
    campaignRef: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.scoreText = scoreText;
    this.graceDays = graceDays;
    this.nameText = nameText;
    this.discount = discount;
    this.externalRef = externalRef;
    this.campaignRef = campaignRef;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toPendingInviteRollupView(item: PendingInviteRollup): PendingInviteRollupView {
  return new PendingInviteRollupView(
    item.code,
    text.truncate(item.title, 40),
    item.ceiling.toFixed(2),
    item.score.toFixed(2),
    String(item.graceDays),
    text.truncate(item.name, 120),
    item.discount.toFixed(2),
    item.externalRef,
    item.campaignRef,
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingInviteRollupViews(items: PendingInviteRollup[]): PendingInviteRollupView[] {
  const views: PendingInviteRollupView[] = [];
  for (const item of items) {
    views.push(toPendingInviteRollupView(item));
  }
  return views;
}

export function sumPendingInviteRollupView(view: PendingInviteRollupView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedCeiling + parsedScore + parsedGraceDays;
}
