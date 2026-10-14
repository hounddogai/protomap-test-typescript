import { AdaptiveRewardRuleSummary } from "./adaptive-reward-rule-summary.js";

/** How screens and exports show a adaptive reward rule summary. */
export class AdaptiveRewardRuleSummaryView {
  code: string;
  name: string;
  expiresAt: string;
  sequence: string;
  timezone: string;
  attempts: string;
  maximum: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    expiresAt: string,
    sequence: string,
    timezone: string,
    attempts: string,
    maximum: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.sequence = sequence;
    this.timezone = timezone;
    this.attempts = attempts;
    this.maximum = maximum;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveRewardRuleSummaryView(item: AdaptiveRewardRuleSummary): AdaptiveRewardRuleSummaryView {
  return new AdaptiveRewardRuleSummaryView(
    item.code,
    item.name,
    String(item.expiresAt),
    String(item.sequence),
    item.timezone,
    String(item.attempts),
    item.maximum.toFixed(2),
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveRewardRuleSummaryViews(items: AdaptiveRewardRuleSummary[]): AdaptiveRewardRuleSummaryView[] {
  const views: AdaptiveRewardRuleSummaryView[] = [];
  for (const item of items) {
    views.push(toAdaptiveRewardRuleSummaryView(item));
  }
  return views;
}

export function sumAdaptiveRewardRuleSummaryView(view: AdaptiveRewardRuleSummaryView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedExpiresAt + parsedSequence + parsedAttempts;
}
