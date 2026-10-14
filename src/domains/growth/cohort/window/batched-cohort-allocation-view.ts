import { BatchedCohortAllocation } from "./batched-cohort-allocation.js";

/** How screens and exports show a batched cohort allocation. */
export class BatchedCohortAllocationView {
  codeText: string;
  nameText: string;
  version: string;
  ownerId: string;
  batchSize: string;
  utmSourceText: string;
  amountText: string;
  title: string;
  limit: string;
  archived: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    version: string,
    ownerId: string,
    batchSize: string,
    utmSourceText: string,
    amountText: string,
    title: string,
    limit: string,
    archived: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.version = version;
    this.ownerId = ownerId;
    this.batchSize = batchSize;
    this.utmSourceText = utmSourceText;
    this.amountText = amountText;
    this.title = title;
    this.limit = limit;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedCohortAllocationView(item: BatchedCohortAllocation): BatchedCohortAllocationView {
  return new BatchedCohortAllocationView(
    item.code,
    item.name,
    String(item.version),
    item.ownerId,
    String(item.batchSize),
    item.utmSource,
    item.amount.toFixed(2),
    item.title,
    String(item.limit),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedCohortAllocationViews(items: BatchedCohortAllocation[]): BatchedCohortAllocationView[] {
  const views: BatchedCohortAllocationView[] = [];
  for (const item of items) {
    views.push(toBatchedCohortAllocationView(item));
  }
  return views;
}

export function sumBatchedCohortAllocationView(view: BatchedCohortAllocationView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedVersion + parsedBatchSize + parsedAmount;
}
