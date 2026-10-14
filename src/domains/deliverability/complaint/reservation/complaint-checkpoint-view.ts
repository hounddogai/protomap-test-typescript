import * as text from "../../../../kit/text.js";
import { ComplaintCheckpoint } from "./complaint-checkpoint.js";

/** How screens and exports show a complaint checkpoint. */
export class ComplaintCheckpointView {
  codeText: string;
  name: string;
  score: string;
  endsAtText: string;
  weight: string;
  ownerIdText: string;
  limit: string;
  archived: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    score: string,
    endsAtText: string,
    weight: string,
    ownerIdText: string,
    limit: string,
    archived: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.score = score;
    this.endsAtText = endsAtText;
    this.weight = weight;
    this.ownerIdText = ownerIdText;
    this.limit = limit;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintCheckpointView(item: ComplaintCheckpoint): ComplaintCheckpointView {
  return new ComplaintCheckpointView(
    item.code,
    item.name,
    item.score.toFixed(2),
    String(item.endsAt),
    item.weight.toFixed(2),
    text.truncate(item.ownerId, 80),
    String(item.limit),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintCheckpointViews(items: ComplaintCheckpoint[]): ComplaintCheckpointView[] {
  const views: ComplaintCheckpointView[] = [];
  for (const item of items) {
    views.push(toComplaintCheckpointView(item));
  }
  return views;
}

export function sumComplaintCheckpointView(view: ComplaintCheckpointView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedScore + parsedEndsAt + parsedWeight;
}
