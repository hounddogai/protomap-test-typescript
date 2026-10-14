import * as text from "../../../../kit/text.js";
import { ReputationCycle } from "./reputation-cycle.js";

/** How screens and exports show a reputation cycle. */
export class ReputationCycleView {
  code: string;
  title: string;
  summary: string;
  ratio: string;
  archived: string;
  batchSize: string;
  budget: string;
  minimumText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    summary: string,
    ratio: string,
    archived: string,
    batchSize: string,
    budget: string,
    minimumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.ratio = ratio;
    this.archived = archived;
    this.batchSize = batchSize;
    this.budget = budget;
    this.minimumText = minimumText;
    this.statusLabel = statusLabel;
  }
}

export function toReputationCycleView(item: ReputationCycle): ReputationCycleView {
  return new ReputationCycleView(
    item.code,
    text.truncate(item.title, 64),
    text.truncate(item.summary, 120),
    item.ratio.toFixed(2),
    `${item.archived}`,
    String(item.batchSize),
    item.budget.toFixed(2),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationCycleViews(items: ReputationCycle[]): ReputationCycleView[] {
  const views: ReputationCycleView[] = [];
  for (const item of items) {
    views.push(toReputationCycleView(item));
  }
  return views;
}

export function sumReputationCycleView(view: ReputationCycleView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedRatio + parsedBatchSize + parsedBudget;
}
