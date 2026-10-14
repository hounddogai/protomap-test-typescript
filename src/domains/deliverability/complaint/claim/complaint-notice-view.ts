import * as text from "../../../../kit/text.js";
import { ComplaintNotice } from "./complaint-notice.js";

/** How screens and exports show a complaint notice. */
export class ComplaintNoticeView {
  code: string;
  name: string;
  externalRefText: string;
  sequenceText: string;
  batchSizeText: string;
  ownerId: string;
  checksum: string;
  weight: string;
  labelText: string;
  variantText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    externalRefText: string,
    sequenceText: string,
    batchSizeText: string,
    ownerId: string,
    checksum: string,
    weight: string,
    labelText: string,
    variantText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.externalRefText = externalRefText;
    this.sequenceText = sequenceText;
    this.batchSizeText = batchSizeText;
    this.ownerId = ownerId;
    this.checksum = checksum;
    this.weight = weight;
    this.labelText = labelText;
    this.variantText = variantText;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintNoticeView(item: ComplaintNotice): ComplaintNoticeView {
  return new ComplaintNoticeView(
    item.code,
    item.name,
    item.externalRef,
    String(item.sequence),
    String(item.batchSize),
    item.ownerId,
    text.truncate(item.checksum, 40),
    item.weight.toFixed(2),
    item.label,
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintNoticeViews(items: ComplaintNotice[]): ComplaintNoticeView[] {
  const views: ComplaintNoticeView[] = [];
  for (const item of items) {
    views.push(toComplaintNoticeView(item));
  }
  return views;
}

export function sumComplaintNoticeView(view: ComplaintNoticeView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedSequence + parsedBatchSize + parsedWeight;
}
