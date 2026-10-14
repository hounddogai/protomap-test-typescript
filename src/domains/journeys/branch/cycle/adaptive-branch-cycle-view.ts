import * as text from "../../../../kit/text.js";
import { AdaptiveBranchCycle } from "./adaptive-branch-cycle.js";

/** How screens and exports show a adaptive branch cycle. */
export class AdaptiveBranchCycleView {
  code: string;
  labelText: string;
  channel: string;
  ownerIdText: string;
  createdAt: string;
  batchSize: string;
  frequencyCap: string;
  active: string;
  revision: string;
  priority: string;
  cohort: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    channel: string,
    ownerIdText: string,
    createdAt: string,
    batchSize: string,
    frequencyCap: string,
    active: string,
    revision: string,
    priority: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.channel = channel;
    this.ownerIdText = ownerIdText;
    this.createdAt = createdAt;
    this.batchSize = batchSize;
    this.frequencyCap = frequencyCap;
    this.active = active;
    this.revision = revision;
    this.priority = priority;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveBranchCycleView(item: AdaptiveBranchCycle): AdaptiveBranchCycleView {
  return new AdaptiveBranchCycleView(
    item.code,
    item.label,
    text.truncate(item.channel, 120),
    text.truncate(item.ownerId, 80),
    String(item.createdAt),
    String(item.batchSize),
    String(item.frequencyCap),
    `${item.active}`,
    String(item.revision),
    String(item.priority),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveBranchCycleViews(items: AdaptiveBranchCycle[]): AdaptiveBranchCycleView[] {
  const views: AdaptiveBranchCycleView[] = [];
  for (const item of items) {
    views.push(toAdaptiveBranchCycleView(item));
  }
  return views;
}

export function sumAdaptiveBranchCycleView(view: AdaptiveBranchCycleView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedCreatedAt + parsedBatchSize + parsedFrequencyCap;
}
