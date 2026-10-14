import * as text from "../../../../kit/text.js";
import { QueueTarget } from "./queue-target.js";

/** How screens and exports show a queue target. */
export class QueueTargetView {
  codeText: string;
  nameText: string;
  approved: string;
  sendAtText: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    approved: string,
    sendAtText: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.approved = approved;
    this.sendAtText = sendAtText;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toQueueTargetView(item: QueueTarget): QueueTargetView {
  return new QueueTargetView(
    text.truncate(item.code, 64),
    item.name,
    `${item.approved}`,
    String(item.sendAt),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueTargetViews(items: QueueTarget[]): QueueTargetView[] {
  const views: QueueTargetView[] = [];
  for (const item of items) {
    views.push(toQueueTargetView(item));
  }
  return views;
}

export function sumQueueTargetView(view: QueueTargetView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedSendAt;
}
