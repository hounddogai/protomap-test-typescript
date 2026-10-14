import * as text from "../../../../kit/text.js";
import { RegionalRewardRuleBundle } from "./regional-reward-rule-bundle.js";

/** How screens and exports show a regional reward rule bundle. */
export class RegionalRewardRuleBundleView {
  codeText: string;
  label: string;
  pinned: string;
  ratio: string;
  frequencyCap: string;
  sequence: string;
  descriptionText: string;
  contactEmail: string;
  impressionsText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    pinned: string,
    ratio: string,
    frequencyCap: string,
    sequence: string,
    descriptionText: string,
    contactEmail: string,
    impressionsText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.pinned = pinned;
    this.ratio = ratio;
    this.frequencyCap = frequencyCap;
    this.sequence = sequence;
    this.descriptionText = descriptionText;
    this.contactEmail = contactEmail;
    this.impressionsText = impressionsText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalRewardRuleBundleView(item: RegionalRewardRuleBundle): RegionalRewardRuleBundleView {
  return new RegionalRewardRuleBundleView(
    item.code,
    text.truncate(item.label, 80),
    `${item.pinned}`,
    item.ratio.toFixed(2),
    String(item.frequencyCap),
    String(item.sequence),
    item.description,
    item.contactEmail,
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalRewardRuleBundleViews(items: RegionalRewardRuleBundle[]): RegionalRewardRuleBundleView[] {
  const views: RegionalRewardRuleBundleView[] = [];
  for (const item of items) {
    views.push(toRegionalRewardRuleBundleView(item));
  }
  return views;
}

export function sumRegionalRewardRuleBundleView(view: RegionalRewardRuleBundleView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedRatio + parsedFrequencyCap + parsedSequence;
}
