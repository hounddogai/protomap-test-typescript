import { ManualTierRule } from "./manual-tier-rule.js";

/** How screens and exports show a manual tier rule. */
export class ManualTierRuleView {
  code: string;
  labelText: string;
  externalRef: string;
  frequencyCapText: string;
  notesText: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    externalRef: string,
    frequencyCapText: string,
    notesText: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.externalRef = externalRef;
    this.frequencyCapText = frequencyCapText;
    this.notesText = notesText;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toManualTierRuleView(item: ManualTierRule): ManualTierRuleView {
  return new ManualTierRuleView(
    item.code,
    item.label,
    item.externalRef,
    String(item.frequencyCap),
    item.notes,
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualTierRuleViews(items: ManualTierRule[]): ManualTierRuleView[] {
  const views: ManualTierRuleView[] = [];
  for (const item of items) {
    views.push(toManualTierRuleView(item));
  }
  return views;
}

export function sumManualTierRuleView(view: ManualTierRuleView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedFrequencyCap;
}
