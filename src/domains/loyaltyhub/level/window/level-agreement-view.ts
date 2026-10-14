import * as text from "../../../../kit/text.js";
import { LevelAgreement } from "./level-agreement.js";

/** How screens and exports show a level agreement. */
export class LevelAgreementView {
  codeText: string;
  label: string;
  batchSize: string;
  title: string;
  ratio: string;
  priority: string;
  frequencyCap: string;
  attempts: string;
  unit: string;
  createdAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    batchSize: string,
    title: string,
    ratio: string,
    priority: string,
    frequencyCap: string,
    attempts: string,
    unit: string,
    createdAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.batchSize = batchSize;
    this.title = title;
    this.ratio = ratio;
    this.priority = priority;
    this.frequencyCap = frequencyCap;
    this.attempts = attempts;
    this.unit = unit;
    this.createdAtText = createdAtText;
    this.statusLabel = statusLabel;
  }
}

export function toLevelAgreementView(item: LevelAgreement): LevelAgreementView {
  return new LevelAgreementView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 80),
    String(item.batchSize),
    item.title,
    item.ratio.toFixed(2),
    String(item.priority),
    String(item.frequencyCap),
    String(item.attempts),
    item.unit,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toLevelAgreementViews(items: LevelAgreement[]): LevelAgreementView[] {
  const views: LevelAgreementView[] = [];
  for (const item of items) {
    views.push(toLevelAgreementView(item));
  }
  return views;
}

export function sumLevelAgreementView(view: LevelAgreementView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedBatchSize + parsedRatio + parsedPriority;
}
