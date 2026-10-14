import { BounceBatch } from "./bounce-batch.js";

/** How screens and exports show a bounce batch. */
export class BounceBatchView {
  code: string;
  name: string;
  ownerIdText: string;
  channelText: string;
  ceiling: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    ownerIdText: string,
    channelText: string,
    ceiling: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.ownerIdText = ownerIdText;
    this.channelText = channelText;
    this.ceiling = ceiling;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toBounceBatchView(item: BounceBatch): BounceBatchView {
  return new BounceBatchView(
    item.code,
    item.name,
    item.ownerId,
    item.channel,
    item.ceiling.toFixed(2),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceBatchViews(items: BounceBatch[]): BounceBatchView[] {
  const views: BounceBatchView[] = [];
  for (const item of items) {
    views.push(toBounceBatchView(item));
  }
  return views;
}

export function sumBounceBatchView(view: BounceBatchView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedCeiling;
}
