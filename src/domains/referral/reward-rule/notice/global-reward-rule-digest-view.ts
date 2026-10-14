import * as text from "../../../../kit/text.js";
import { GlobalRewardRuleDigest } from "./global-reward-rule-digest.js";

/** How screens and exports show a global reward rule digest. */
export class GlobalRewardRuleDigestView {
  code: string;
  label: string;
  impressions: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(code: string, label: string, impressions: string, frequencyCap: string, statusLabel: string) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalRewardRuleDigestView(item: GlobalRewardRuleDigest): GlobalRewardRuleDigestView {
  return new GlobalRewardRuleDigestView(
    item.code,
    text.truncate(item.label, 64),
    String(item.impressions),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalRewardRuleDigestViews(items: GlobalRewardRuleDigest[]): GlobalRewardRuleDigestView[] {
  const views: GlobalRewardRuleDigestView[] = [];
  for (const item of items) {
    views.push(toGlobalRewardRuleDigestView(item));
  }
  return views;
}

export function sumGlobalRewardRuleDigestView(view: GlobalRewardRuleDigestView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedImpressions + parsedFrequencyCap;
}
