import * as text from "../../../../kit/text.js";
import { AdaptiveRewardRuleLedger } from "./adaptive-reward-rule-ledger.js";

/** How screens and exports show a adaptive reward rule ledger. */
export class AdaptiveRewardRuleLedgerView {
  code: string;
  label: string;
  timezone: string;
  nameText: string;
  clicks: string;
  revision: string;
  active: string;
  score: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    timezone: string,
    nameText: string,
    clicks: string,
    revision: string,
    active: string,
    score: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.nameText = nameText;
    this.clicks = clicks;
    this.revision = revision;
    this.active = active;
    this.score = score;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveRewardRuleLedgerView(item: AdaptiveRewardRuleLedger): AdaptiveRewardRuleLedgerView {
  return new AdaptiveRewardRuleLedgerView(
    item.code,
    item.label,
    text.truncate(item.timezone, 64),
    item.name,
    String(item.clicks),
    String(item.revision),
    `${item.active}`,
    item.score.toFixed(2),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveRewardRuleLedgerViews(items: AdaptiveRewardRuleLedger[]): AdaptiveRewardRuleLedgerView[] {
  const views: AdaptiveRewardRuleLedgerView[] = [];
  for (const item of items) {
    views.push(toAdaptiveRewardRuleLedgerView(item));
  }
  return views;
}

export function sumAdaptiveRewardRuleLedgerView(view: AdaptiveRewardRuleLedgerView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedClicks + parsedRevision + parsedScore;
}
