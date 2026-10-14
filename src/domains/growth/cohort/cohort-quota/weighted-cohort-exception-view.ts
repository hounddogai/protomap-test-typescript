import * as text from "../../../../kit/text.js";
import { WeightedCohortException } from "./weighted-cohort-exception.js";

/** How screens and exports show a weighted cohort exception. */
export class WeightedCohortExceptionView {
  codeText: string;
  label: string;
  channelText: string;
  cost: string;
  utmSource: string;
  descriptionText: string;
  sequence: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    channelText: string,
    cost: string,
    utmSource: string,
    descriptionText: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.channelText = channelText;
    this.cost = cost;
    this.utmSource = utmSource;
    this.descriptionText = descriptionText;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedCohortExceptionView(item: WeightedCohortException): WeightedCohortExceptionView {
  return new WeightedCohortExceptionView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 80),
    item.channel,
    item.cost.toFixed(2),
    item.utmSource,
    item.description,
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedCohortExceptionViews(items: WeightedCohortException[]): WeightedCohortExceptionView[] {
  const views: WeightedCohortExceptionView[] = [];
  for (const item of items) {
    views.push(toWeightedCohortExceptionView(item));
  }
  return views;
}

export function sumWeightedCohortExceptionView(view: WeightedCohortExceptionView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedCost + parsedSequence;
}
