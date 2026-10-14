import * as text from "../../../../kit/text.js";
import { BatchedMacroCheckpoint } from "./batched-macro-checkpoint.js";

/** How screens and exports show a batched macro checkpoint. */
export class BatchedMacroCheckpointView {
  code: string;
  title: string;
  summary: string;
  attempts: string;
  visibleText: string;
  pinned: string;
  channelText: string;
  limitText: string;
  locale: string;
  descriptionText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    summary: string,
    attempts: string,
    visibleText: string,
    pinned: string,
    channelText: string,
    limitText: string,
    locale: string,
    descriptionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.attempts = attempts;
    this.visibleText = visibleText;
    this.pinned = pinned;
    this.channelText = channelText;
    this.limitText = limitText;
    this.locale = locale;
    this.descriptionText = descriptionText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedMacroCheckpointView(item: BatchedMacroCheckpoint): BatchedMacroCheckpointView {
  return new BatchedMacroCheckpointView(
    item.code,
    text.truncate(item.title, 40),
    item.summary,
    String(item.attempts),
    `${item.visible}`,
    `${item.pinned}`,
    item.channel,
    String(item.limit),
    item.locale,
    text.truncate(item.description, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedMacroCheckpointViews(items: BatchedMacroCheckpoint[]): BatchedMacroCheckpointView[] {
  const views: BatchedMacroCheckpointView[] = [];
  for (const item of items) {
    views.push(toBatchedMacroCheckpointView(item));
  }
  return views;
}

export function sumBatchedMacroCheckpointView(view: BatchedMacroCheckpointView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedAttempts + parsedLimit;
}
