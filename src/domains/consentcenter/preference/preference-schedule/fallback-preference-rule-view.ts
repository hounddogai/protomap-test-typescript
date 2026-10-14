import { FallbackPreferenceRule } from "./fallback-preference-rule.js";

/** How screens and exports show a fallback preference rule. */
export class FallbackPreferenceRuleView {
  codeText: string;
  title: string;
  createdAt: string;
  campaignRef: string;
  statusLabel: string;

  constructor(codeText: string, title: string, createdAt: string, campaignRef: string, statusLabel: string) {
    this.codeText = codeText;
    this.title = title;
    this.createdAt = createdAt;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackPreferenceRuleView(item: FallbackPreferenceRule): FallbackPreferenceRuleView {
  return new FallbackPreferenceRuleView(
    item.code,
    item.title,
    String(item.createdAt),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackPreferenceRuleViews(items: FallbackPreferenceRule[]): FallbackPreferenceRuleView[] {
  const views: FallbackPreferenceRuleView[] = [];
  for (const item of items) {
    views.push(toFallbackPreferenceRuleView(item));
  }
  return views;
}

export function sumFallbackPreferenceRuleView(view: FallbackPreferenceRuleView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedCreatedAt;
}
