import { LegacyDeflectionRule } from "./legacy-deflection-rule.js";

/** How screens and exports show a legacy deflection rule. */
export class LegacyDeflectionRuleView {
  code: string;
  title: string;
  sequence: string;
  rate: string;
  cohort: string;
  countryText: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    sequence: string,
    rate: string,
    cohort: string,
    countryText: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.rate = rate;
    this.cohort = cohort;
    this.countryText = countryText;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyDeflectionRuleView(item: LegacyDeflectionRule): LegacyDeflectionRuleView {
  return new LegacyDeflectionRuleView(
    item.code,
    item.title,
    String(item.sequence),
    item.rate.toFixed(2),
    item.cohort,
    item.country,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyDeflectionRuleViews(items: LegacyDeflectionRule[]): LegacyDeflectionRuleView[] {
  const views: LegacyDeflectionRuleView[] = [];
  for (const item of items) {
    views.push(toLegacyDeflectionRuleView(item));
  }
  return views;
}

export function sumLegacyDeflectionRuleView(view: LegacyDeflectionRuleView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedSequence + parsedRate + parsedCapacity;
}
