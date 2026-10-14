import * as text from "../../../../kit/text.js";
import { BatchedFlightAgreement } from "./batched-flight-agreement.js";

/** How screens and exports show a batched flight agreement. */
export class BatchedFlightAgreementView {
  code: string;
  nameText: string;
  notesText: string;
  contactEmail: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    notesText: string,
    contactEmail: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.notesText = notesText;
    this.contactEmail = contactEmail;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedFlightAgreementView(item: BatchedFlightAgreement): BatchedFlightAgreementView {
  return new BatchedFlightAgreementView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 80),
    text.truncate(item.notes, 120),
    item.contactEmail,
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedFlightAgreementViews(items: BatchedFlightAgreement[]): BatchedFlightAgreementView[] {
  const views: BatchedFlightAgreementView[] = [];
  for (const item of items) {
    views.push(toBatchedFlightAgreementView(item));
  }
  return views;
}

export function sumBatchedFlightAgreementView(view: BatchedFlightAgreementView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedBatchSize;
}
