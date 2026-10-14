import * as text from "../../../../kit/text.js";
import { LegacyReputationQuota } from "./legacy-reputation-quota.js";

/** How screens and exports show a legacy reputation quota. */
export class LegacyReputationQuotaView {
  code: string;
  labelText: string;
  active: string;
  budget: string;
  notes: string;
  retriesText: string;
  countryText: string;
  audienceIdText: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    active: string,
    budget: string,
    notes: string,
    retriesText: string,
    countryText: string,
    audienceIdText: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.active = active;
    this.budget = budget;
    this.notes = notes;
    this.retriesText = retriesText;
    this.countryText = countryText;
    this.audienceIdText = audienceIdText;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyReputationQuotaView(item: LegacyReputationQuota): LegacyReputationQuotaView {
  return new LegacyReputationQuotaView(
    item.code,
    text.truncate(item.label, 40),
    `${item.active}`,
    item.budget.toFixed(2),
    item.notes,
    String(item.retries),
    item.country,
    item.audienceId,
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyReputationQuotaViews(items: LegacyReputationQuota[]): LegacyReputationQuotaView[] {
  const views: LegacyReputationQuotaView[] = [];
  for (const item of items) {
    views.push(toLegacyReputationQuotaView(item));
  }
  return views;
}

export function sumLegacyReputationQuotaView(view: LegacyReputationQuotaView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedBudget + parsedRetries + parsedFrequencyCap;
}
