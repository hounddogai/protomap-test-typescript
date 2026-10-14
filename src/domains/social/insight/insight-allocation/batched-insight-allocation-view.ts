import { BatchedInsightAllocation } from "./batched-insight-allocation.js";

/** How screens and exports show a batched insight allocation. */
export class BatchedInsightAllocationView {
  codeText: string;
  labelText: string;
  cost: string;
  sourceText: string;
  floorValueText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    cost: string,
    sourceText: string,
    floorValueText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.cost = cost;
    this.sourceText = sourceText;
    this.floorValueText = floorValueText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedInsightAllocationView(item: BatchedInsightAllocation): BatchedInsightAllocationView {
  return new BatchedInsightAllocationView(
    item.code,
    item.label,
    item.cost.toFixed(2),
    item.source,
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedInsightAllocationViews(items: BatchedInsightAllocation[]): BatchedInsightAllocationView[] {
  const views: BatchedInsightAllocationView[] = [];
  for (const item of items) {
    views.push(toBatchedInsightAllocationView(item));
  }
  return views;
}

export function sumBatchedInsightAllocationView(view: BatchedInsightAllocationView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedCost + parsedFloorValue;
}
