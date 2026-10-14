import * as text from "../../../../kit/text.js";
import { CohortTarget } from "./cohort-target.js";

/** How screens and exports show a cohort target. */
export class CohortTargetView {
  codeText: string;
  nameText: string;
  batchSizeText: string;
  priority: string;
  cohort: string;
  version: string;
  label: string;
  maximumText: string;
  score: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    batchSizeText: string,
    priority: string,
    cohort: string,
    version: string,
    label: string,
    maximumText: string,
    score: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.batchSizeText = batchSizeText;
    this.priority = priority;
    this.cohort = cohort;
    this.version = version;
    this.label = label;
    this.maximumText = maximumText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toCohortTargetView(item: CohortTarget): CohortTargetView {
  return new CohortTargetView(
    item.code,
    item.name,
    String(item.batchSize),
    String(item.priority),
    item.cohort,
    String(item.version),
    text.truncate(item.label, 64),
    item.maximum.toFixed(2),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortTargetViews(items: CohortTarget[]): CohortTargetView[] {
  const views: CohortTargetView[] = [];
  for (const item of items) {
    views.push(toCohortTargetView(item));
  }
  return views;
}

export function sumCohortTargetView(view: CohortTargetView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedBatchSize + parsedPriority + parsedVersion;
}
