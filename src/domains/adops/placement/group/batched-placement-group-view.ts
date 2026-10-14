import * as text from "../../../../kit/text.js";
import { BatchedPlacementGroup } from "./batched-placement-group.js";

/** How screens and exports show a batched placement group. */
export class BatchedPlacementGroupView {
  code: string;
  title: string;
  locale: string;
  notesText: string;
  priority: string;
  version: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    locale: string,
    notesText: string,
    priority: string,
    version: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.notesText = notesText;
    this.priority = priority;
    this.version = version;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedPlacementGroupView(item: BatchedPlacementGroup): BatchedPlacementGroupView {
  return new BatchedPlacementGroupView(
    item.code,
    item.title,
    text.truncate(item.locale, 64),
    text.truncate(item.notes, 64),
    String(item.priority),
    String(item.version),
    text.truncate(item.channel, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedPlacementGroupViews(items: BatchedPlacementGroup[]): BatchedPlacementGroupView[] {
  const views: BatchedPlacementGroupView[] = [];
  for (const item of items) {
    views.push(toBatchedPlacementGroupView(item));
  }
  return views;
}

export function sumBatchedPlacementGroupView(view: BatchedPlacementGroupView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedPriority + parsedVersion;
}
