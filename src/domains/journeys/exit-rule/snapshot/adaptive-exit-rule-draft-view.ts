import * as text from "../../../../kit/text.js";
import { AdaptiveExitRuleDraft } from "./adaptive-exit-rule-draft.js";

/** How screens and exports show a adaptive exit rule draft. */
export class AdaptiveExitRuleDraftView {
  codeText: string;
  name: string;
  locale: string;
  frequencyCap: string;
  phone: string;
  priorityText: string;
  cohortText: string;
  source: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    locale: string,
    frequencyCap: string,
    phone: string,
    priorityText: string,
    cohortText: string,
    source: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.phone = phone;
    this.priorityText = priorityText;
    this.cohortText = cohortText;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveExitRuleDraftView(item: AdaptiveExitRuleDraft): AdaptiveExitRuleDraftView {
  return new AdaptiveExitRuleDraftView(
    text.truncate(item.code, 120),
    item.name,
    item.locale,
    String(item.frequencyCap),
    item.phone,
    String(item.priority),
    item.cohort,
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveExitRuleDraftViews(items: AdaptiveExitRuleDraft[]): AdaptiveExitRuleDraftView[] {
  const views: AdaptiveExitRuleDraftView[] = [];
  for (const item of items) {
    views.push(toAdaptiveExitRuleDraftView(item));
  }
  return views;
}

export function sumAdaptiveExitRuleDraftView(view: AdaptiveExitRuleDraftView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedFrequencyCap + parsedPriority;
}
