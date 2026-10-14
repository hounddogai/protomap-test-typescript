import * as text from "../../../../kit/text.js";
import { PathDraft } from "./path-draft.js";

/** How screens and exports show a path draft. */
export class PathDraftView {
  code: string;
  name: string;
  unitText: string;
  reviewer: string;
  batchSizeText: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    unitText: string,
    reviewer: string,
    batchSizeText: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.unitText = unitText;
    this.reviewer = reviewer;
    this.batchSizeText = batchSizeText;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toPathDraftView(item: PathDraft): PathDraftView {
  return new PathDraftView(
    text.truncate(item.code, 40),
    item.name,
    item.unit,
    item.reviewer,
    String(item.batchSize),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathDraftViews(items: PathDraft[]): PathDraftView[] {
  const views: PathDraftView[] = [];
  for (const item of items) {
    views.push(toPathDraftView(item));
  }
  return views;
}

export function sumPathDraftView(view: PathDraftView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedBatchSize + parsedExpiresAt;
}
