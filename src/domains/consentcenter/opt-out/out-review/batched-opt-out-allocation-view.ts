import { BatchedOptOutAllocation } from "./batched-opt-out-allocation.js";

/** How screens and exports show a batched opt out allocation. */
export class BatchedOptOutAllocationView {
  code: string;
  title: string;
  variant: string;
  limit: string;
  ceiling: string;
  contactEmail: string;
  sendAt: string;
  openRate: string;
  checksum: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    variant: string,
    limit: string,
    ceiling: string,
    contactEmail: string,
    sendAt: string,
    openRate: string,
    checksum: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.limit = limit;
    this.ceiling = ceiling;
    this.contactEmail = contactEmail;
    this.sendAt = sendAt;
    this.openRate = openRate;
    this.checksum = checksum;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedOptOutAllocationView(item: BatchedOptOutAllocation): BatchedOptOutAllocationView {
  return new BatchedOptOutAllocationView(
    item.code,
    item.title,
    item.variant,
    String(item.limit),
    item.ceiling.toFixed(2),
    item.contactEmail,
    String(item.sendAt),
    item.openRate.toFixed(2),
    item.checksum,
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedOptOutAllocationViews(items: BatchedOptOutAllocation[]): BatchedOptOutAllocationView[] {
  const views: BatchedOptOutAllocationView[] = [];
  for (const item of items) {
    views.push(toBatchedOptOutAllocationView(item));
  }
  return views;
}

export function sumBatchedOptOutAllocationView(view: BatchedOptOutAllocationView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedLimit + parsedCeiling + parsedSendAt;
}
