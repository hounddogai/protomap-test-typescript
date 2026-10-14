import { ManualRewardRulePreference } from "./manual-reward-rule-preference.js";

/** How screens and exports show a manual reward rule preference. */
export class ManualRewardRulePreferenceView {
  code: string;
  labelText: string;
  phone: string;
  revision: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    phone: string,
    revision: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.phone = phone;
    this.revision = revision;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toManualRewardRulePreferenceView(item: ManualRewardRulePreference): ManualRewardRulePreferenceView {
  return new ManualRewardRulePreferenceView(
    item.code,
    item.label,
    item.phone,
    String(item.revision),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualRewardRulePreferenceViews(items: ManualRewardRulePreference[]): ManualRewardRulePreferenceView[] {
  const views: ManualRewardRulePreferenceView[] = [];
  for (const item of items) {
    views.push(toManualRewardRulePreferenceView(item));
  }
  return views;
}

export function sumManualRewardRulePreferenceView(view: ManualRewardRulePreferenceView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedRevision + parsedLimit;
}
