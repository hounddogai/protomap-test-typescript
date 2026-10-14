import { PrimaryMentionDraft } from "./primary-mention-draft.js";

/** How screens and exports show a primary mention draft. */
export class PrimaryMentionDraftView {
  code: string;
  title: string;
  currencyText: string;
  batchSize: string;
  description: string;
  ownerId: string;
  weightText: string;
  unitText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    currencyText: string,
    batchSize: string,
    description: string,
    ownerId: string,
    weightText: string,
    unitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.currencyText = currencyText;
    this.batchSize = batchSize;
    this.description = description;
    this.ownerId = ownerId;
    this.weightText = weightText;
    this.unitText = unitText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryMentionDraftView(item: PrimaryMentionDraft): PrimaryMentionDraftView {
  return new PrimaryMentionDraftView(
    item.code,
    item.title,
    item.currency,
    String(item.batchSize),
    item.description,
    item.ownerId,
    item.weight.toFixed(2),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryMentionDraftViews(items: PrimaryMentionDraft[]): PrimaryMentionDraftView[] {
  const views: PrimaryMentionDraftView[] = [];
  for (const item of items) {
    views.push(toPrimaryMentionDraftView(item));
  }
  return views;
}

export function sumPrimaryMentionDraftView(view: PrimaryMentionDraftView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedBatchSize + parsedWeight;
}
