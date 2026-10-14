import * as text from "../../../../kit/text.js";
import { PendingWaitSummary } from "./pending-wait-summary.js";

/** How screens and exports show a pending wait summary. */
export class PendingWaitSummaryView {
  code: string;
  title: string;
  pinnedText: string;
  name: string;
  priority: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    pinnedText: string,
    name: string,
    priority: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.pinnedText = pinnedText;
    this.name = name;
    this.priority = priority;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toPendingWaitSummaryView(item: PendingWaitSummary): PendingWaitSummaryView {
  return new PendingWaitSummaryView(
    item.code,
    item.title,
    `${item.pinned}`,
    text.truncate(item.name, 80),
    String(item.priority),
    text.truncate(item.ownerId, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingWaitSummaryViews(items: PendingWaitSummary[]): PendingWaitSummaryView[] {
  const views: PendingWaitSummaryView[] = [];
  for (const item of items) {
    views.push(toPendingWaitSummaryView(item));
  }
  return views;
}

export function sumPendingWaitSummaryView(view: PendingWaitSummaryView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedPriority;
}
