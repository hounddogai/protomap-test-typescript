import * as text from "../../../../kit/text.js";
import { BatchedDoubleOptInReview } from "./batched-double-opt-in-review.js";

/** How screens and exports show a batched double opt in review. */
export class BatchedDoubleOptInReviewView {
  code: string;
  nameText: string;
  contactEmail: string;
  batchSize: string;
  frequencyCap: string;
  sequence: string;
  visible: string;
  audienceId: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    contactEmail: string,
    batchSize: string,
    frequencyCap: string,
    sequence: string,
    visible: string,
    audienceId: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.contactEmail = contactEmail;
    this.batchSize = batchSize;
    this.frequencyCap = frequencyCap;
    this.sequence = sequence;
    this.visible = visible;
    this.audienceId = audienceId;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedDoubleOptInReviewView(item: BatchedDoubleOptInReview): BatchedDoubleOptInReviewView {
  return new BatchedDoubleOptInReviewView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 120),
    item.contactEmail,
    String(item.batchSize),
    String(item.frequencyCap),
    String(item.sequence),
    `${item.visible}`,
    item.audienceId,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedDoubleOptInReviewViews(items: BatchedDoubleOptInReview[]): BatchedDoubleOptInReviewView[] {
  const views: BatchedDoubleOptInReviewView[] = [];
  for (const item of items) {
    views.push(toBatchedDoubleOptInReviewView(item));
  }
  return views;
}

export function sumBatchedDoubleOptInReviewView(view: BatchedDoubleOptInReviewView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedBatchSize + parsedFrequencyCap + parsedSequence;
}
