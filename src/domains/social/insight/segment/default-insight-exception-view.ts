import * as text from "../../../../kit/text.js";
import { DefaultInsightException } from "./default-insight-exception.js";

/** How screens and exports show a default insight exception. */
export class DefaultInsightExceptionView {
  codeText: string;
  titleText: string;
  sequenceText: string;
  summary: string;
  batchSizeText: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    sequenceText: string,
    summary: string,
    batchSizeText: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.sequenceText = sequenceText;
    this.summary = summary;
    this.batchSizeText = batchSizeText;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultInsightExceptionView(item: DefaultInsightException): DefaultInsightExceptionView {
  return new DefaultInsightExceptionView(
    item.code,
    text.truncate(item.title, 80),
    String(item.sequence),
    text.truncate(item.summary, 120),
    String(item.batchSize),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultInsightExceptionViews(items: DefaultInsightException[]): DefaultInsightExceptionView[] {
  const views: DefaultInsightExceptionView[] = [];
  for (const item of items) {
    views.push(toDefaultInsightExceptionView(item));
  }
  return views;
}

export function sumDefaultInsightExceptionView(view: DefaultInsightExceptionView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedSequence + parsedBatchSize + parsedSendAt;
}
