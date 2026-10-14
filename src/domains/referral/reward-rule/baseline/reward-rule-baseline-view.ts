import * as text from "../../../../kit/text.js";
import { RewardRuleBaseline } from "./reward-rule-baseline.js";

/** How screens and exports show a reward rule baseline. */
export class RewardRuleBaselineView {
  code: string;
  name: string;
  descriptionText: string;
  bidText: string;
  attempts: string;
  revisionText: string;
  endsAt: string;
  currencyText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    descriptionText: string,
    bidText: string,
    attempts: string,
    revisionText: string,
    endsAt: string,
    currencyText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.descriptionText = descriptionText;
    this.bidText = bidText;
    this.attempts = attempts;
    this.revisionText = revisionText;
    this.endsAt = endsAt;
    this.currencyText = currencyText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleBaselineView(item: RewardRuleBaseline): RewardRuleBaselineView {
  return new RewardRuleBaselineView(
    item.code,
    text.truncate(item.name, 40),
    item.description,
    item.bid.toFixed(2),
    String(item.attempts),
    String(item.revision),
    String(item.endsAt),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleBaselineViews(items: RewardRuleBaseline[]): RewardRuleBaselineView[] {
  const views: RewardRuleBaselineView[] = [];
  for (const item of items) {
    views.push(toRewardRuleBaselineView(item));
  }
  return views;
}

export function sumRewardRuleBaselineView(view: RewardRuleBaselineView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedBid + parsedAttempts + parsedRevision;
}
