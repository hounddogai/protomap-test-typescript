import * as text from "../../../../kit/text.js";
import { RollingWarmupMilestone } from "./rolling-warmup-milestone.js";

/** How screens and exports show a rolling warmup milestone. */
export class RollingWarmupMilestoneView {
  code: string;
  label: string;
  revision: string;
  frequencyCap: string;
  batchSize: string;
  attempts: string;
  approvedText: string;
  locale: string;
  conversionRateText: string;
  summaryText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    revision: string,
    frequencyCap: string,
    batchSize: string,
    attempts: string,
    approvedText: string,
    locale: string,
    conversionRateText: string,
    summaryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.frequencyCap = frequencyCap;
    this.batchSize = batchSize;
    this.attempts = attempts;
    this.approvedText = approvedText;
    this.locale = locale;
    this.conversionRateText = conversionRateText;
    this.summaryText = summaryText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingWarmupMilestoneView(item: RollingWarmupMilestone): RollingWarmupMilestoneView {
  return new RollingWarmupMilestoneView(
    text.truncate(item.code, 120),
    item.label,
    String(item.revision),
    String(item.frequencyCap),
    String(item.batchSize),
    String(item.attempts),
    `${item.approved}`,
    item.locale,
    item.conversionRate.toFixed(2),
    text.truncate(item.summary, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingWarmupMilestoneViews(items: RollingWarmupMilestone[]): RollingWarmupMilestoneView[] {
  const views: RollingWarmupMilestoneView[] = [];
  for (const item of items) {
    views.push(toRollingWarmupMilestoneView(item));
  }
  return views;
}

export function sumRollingWarmupMilestoneView(view: RollingWarmupMilestoneView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedRevision + parsedFrequencyCap + parsedBatchSize;
}
