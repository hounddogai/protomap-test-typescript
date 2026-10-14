import * as text from "../../../../kit/text.js";
import { BatchedModelCheckpoint } from "./batched-model-checkpoint.js";

/** How screens and exports show a batched model checkpoint. */
export class BatchedModelCheckpointView {
  code: string;
  name: string;
  description: string;
  audienceId: string;
  priority: string;
  reviewerText: string;
  revision: string;
  impressionsText: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    description: string,
    audienceId: string,
    priority: string,
    reviewerText: string,
    revision: string,
    impressionsText: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.audienceId = audienceId;
    this.priority = priority;
    this.reviewerText = reviewerText;
    this.revision = revision;
    this.impressionsText = impressionsText;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedModelCheckpointView(item: BatchedModelCheckpoint): BatchedModelCheckpointView {
  return new BatchedModelCheckpointView(
    item.code,
    text.truncate(item.name, 80),
    text.truncate(item.description, 120),
    item.audienceId,
    String(item.priority),
    text.truncate(item.reviewer, 120),
    String(item.revision),
    String(item.impressions),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedModelCheckpointViews(items: BatchedModelCheckpoint[]): BatchedModelCheckpointView[] {
  const views: BatchedModelCheckpointView[] = [];
  for (const item of items) {
    views.push(toBatchedModelCheckpointView(item));
  }
  return views;
}

export function sumBatchedModelCheckpointView(view: BatchedModelCheckpointView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedPriority + parsedRevision + parsedImpressions;
}
