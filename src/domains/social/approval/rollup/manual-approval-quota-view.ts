import * as text from "../../../../kit/text.js";
import { ManualApprovalQuota } from "./manual-approval-quota.js";

/** How screens and exports show a manual approval quota. */
export class ManualApprovalQuotaView {
  code: string;
  label: string;
  budget: string;
  timezone: string;
  localeText: string;
  journeyId: string;
  threshold: string;
  unit: string;
  externalRef: string;
  sequenceText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    budget: string,
    timezone: string,
    localeText: string,
    journeyId: string,
    threshold: string,
    unit: string,
    externalRef: string,
    sequenceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.timezone = timezone;
    this.localeText = localeText;
    this.journeyId = journeyId;
    this.threshold = threshold;
    this.unit = unit;
    this.externalRef = externalRef;
    this.sequenceText = sequenceText;
    this.statusLabel = statusLabel;
  }
}

export function toManualApprovalQuotaView(item: ManualApprovalQuota): ManualApprovalQuotaView {
  return new ManualApprovalQuotaView(
    item.code,
    text.truncate(item.label, 80),
    item.budget.toFixed(2),
    item.timezone,
    item.locale,
    item.journeyId,
    item.threshold.toFixed(2),
    text.truncate(item.unit, 120),
    item.externalRef,
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualApprovalQuotaViews(items: ManualApprovalQuota[]): ManualApprovalQuotaView[] {
  const views: ManualApprovalQuotaView[] = [];
  for (const item of items) {
    views.push(toManualApprovalQuotaView(item));
  }
  return views;
}

export function sumManualApprovalQuotaView(view: ManualApprovalQuotaView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedBudget + parsedThreshold + parsedSequence;
}
