import * as text from "../../../../kit/text.js";
import { LenientLevelThreshold } from "./lenient-level-threshold.js";

/** How screens and exports show a lenient level threshold. */
export class LenientLevelThresholdView {
  codeText: string;
  titleText: string;
  description: string;
  audienceIdText: string;
  cohort: string;
  localeText: string;
  version: string;
  segment: string;
  budget: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    description: string,
    audienceIdText: string,
    cohort: string,
    localeText: string,
    version: string,
    segment: string,
    budget: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.description = description;
    this.audienceIdText = audienceIdText;
    this.cohort = cohort;
    this.localeText = localeText;
    this.version = version;
    this.segment = segment;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toLenientLevelThresholdView(item: LenientLevelThreshold): LenientLevelThresholdView {
  return new LenientLevelThresholdView(
    item.code,
    text.truncate(item.title, 40),
    item.description,
    text.truncate(item.audienceId, 120),
    item.cohort,
    item.locale,
    String(item.version),
    item.segment,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientLevelThresholdViews(items: LenientLevelThreshold[]): LenientLevelThresholdView[] {
  const views: LenientLevelThresholdView[] = [];
  for (const item of items) {
    views.push(toLenientLevelThresholdView(item));
  }
  return views;
}

export function sumLenientLevelThresholdView(view: LenientLevelThresholdView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedVersion + parsedBudget;
}
