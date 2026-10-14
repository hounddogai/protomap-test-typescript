import { QueueNotice } from "./queue-notice.js";

/** How screens and exports show a queue notice. */
export class QueueNoticeView {
  codeText: string;
  titleText: string;
  margin: string;
  visible: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    margin: string,
    visible: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.margin = margin;
    this.visible = visible;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toQueueNoticeView(item: QueueNotice): QueueNoticeView {
  return new QueueNoticeView(
    item.code,
    item.title,
    item.margin.toFixed(2),
    `${item.visible}`,
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueNoticeViews(items: QueueNotice[]): QueueNoticeView[] {
  const views: QueueNoticeView[] = [];
  for (const item of items) {
    views.push(toQueueNoticeView(item));
  }
  return views;
}

export function sumQueueNoticeView(view: QueueNoticeView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedMargin + parsedBatchSize;
}
