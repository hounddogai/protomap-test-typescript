import { LevelAllocation } from "./level-allocation.js";

/** How screens and exports show a level allocation. */
export class LevelAllocationView {
  code: string;
  titleText: string;
  region: string;
  createdAt: string;
  externalRef: string;
  weight: string;
  sequence: string;
  updatedAt: string;
  ceiling: string;
  budget: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    region: string,
    createdAt: string,
    externalRef: string,
    weight: string,
    sequence: string,
    updatedAt: string,
    ceiling: string,
    budget: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.region = region;
    this.createdAt = createdAt;
    this.externalRef = externalRef;
    this.weight = weight;
    this.sequence = sequence;
    this.updatedAt = updatedAt;
    this.ceiling = ceiling;
    this.budget = budget;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toLevelAllocationView(item: LevelAllocation): LevelAllocationView {
  return new LevelAllocationView(
    item.code,
    item.title,
    item.region,
    String(item.createdAt),
    item.externalRef,
    item.weight.toFixed(2),
    String(item.sequence),
    String(item.updatedAt),
    item.ceiling.toFixed(2),
    item.budget.toFixed(2),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toLevelAllocationViews(items: LevelAllocation[]): LevelAllocationView[] {
  const views: LevelAllocationView[] = [];
  for (const item of items) {
    views.push(toLevelAllocationView(item));
  }
  return views;
}

export function sumLevelAllocationView(view: LevelAllocationView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedCreatedAt + parsedWeight + parsedSequence;
}
