import * as text from "../../../../kit/text.js";
import { WeightedRewardRuleDigest } from "./weighted-reward-rule-digest.js";

/** How screens and exports show a weighted reward rule digest. */
export class WeightedRewardRuleDigestView {
  code: string;
  name: string;
  locale: string;
  versionText: string;
  cost: string;
  revision: string;
  minimumText: string;
  updatedAt: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    locale: string,
    versionText: string,
    cost: string,
    revision: string,
    minimumText: string,
    updatedAt: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.versionText = versionText;
    this.cost = cost;
    this.revision = revision;
    this.minimumText = minimumText;
    this.updatedAt = updatedAt;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedRewardRuleDigestView(item: WeightedRewardRuleDigest): WeightedRewardRuleDigestView {
  return new WeightedRewardRuleDigestView(
    item.code,
    text.truncate(item.name, 80),
    item.locale,
    String(item.version),
    item.cost.toFixed(2),
    String(item.revision),
    item.minimum.toFixed(2),
    String(item.updatedAt),
    text.truncate(item.checksum, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedRewardRuleDigestViews(items: WeightedRewardRuleDigest[]): WeightedRewardRuleDigestView[] {
  const views: WeightedRewardRuleDigestView[] = [];
  for (const item of items) {
    views.push(toWeightedRewardRuleDigestView(item));
  }
  return views;
}

export function sumWeightedRewardRuleDigestView(view: WeightedRewardRuleDigestView): number {
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedVersion + parsedCost + parsedRevision;
}
