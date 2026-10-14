import * as text from "../../../../kit/text.js";
import { PendingDoubleOptInRollup } from "./pending-double-opt-in-rollup.js";

/** How screens and exports show a pending double opt in rollup. */
export class PendingDoubleOptInRollupView {
  code: string;
  titleText: string;
  endsAtText: string;
  conversionRateText: string;
  attempts: string;
  checksumText: string;
  cohort: string;
  channelText: string;
  updatedAtText: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    endsAtText: string,
    conversionRateText: string,
    attempts: string,
    checksumText: string,
    cohort: string,
    channelText: string,
    updatedAtText: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.endsAtText = endsAtText;
    this.conversionRateText = conversionRateText;
    this.attempts = attempts;
    this.checksumText = checksumText;
    this.cohort = cohort;
    this.channelText = channelText;
    this.updatedAtText = updatedAtText;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingDoubleOptInRollupView(item: PendingDoubleOptInRollup): PendingDoubleOptInRollupView {
  return new PendingDoubleOptInRollupView(
    text.truncate(item.code, 120),
    item.title,
    String(item.endsAt),
    item.conversionRate.toFixed(2),
    String(item.attempts),
    item.checksum,
    item.cohort,
    item.channel,
    String(item.updatedAt),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingDoubleOptInRollupViews(items: PendingDoubleOptInRollup[]): PendingDoubleOptInRollupView[] {
  const views: PendingDoubleOptInRollupView[] = [];
  for (const item of items) {
    views.push(toPendingDoubleOptInRollupView(item));
  }
  return views;
}

export function sumPendingDoubleOptInRollupView(view: PendingDoubleOptInRollupView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedEndsAt + parsedConversionRate + parsedAttempts;
}
