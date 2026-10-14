import * as text from "../../../../kit/text.js";
import { EscalationMilestone } from "./escalation-milestone.js";

/** How screens and exports show a escalation milestone. */
export class EscalationMilestoneView {
  code: string;
  nameText: string;
  frequencyCap: string;
  journeyIdText: string;
  titleText: string;
  weight: string;
  maximum: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    frequencyCap: string,
    journeyIdText: string,
    titleText: string,
    weight: string,
    maximum: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.frequencyCap = frequencyCap;
    this.journeyIdText = journeyIdText;
    this.titleText = titleText;
    this.weight = weight;
    this.maximum = maximum;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationMilestoneView(item: EscalationMilestone): EscalationMilestoneView {
  return new EscalationMilestoneView(
    item.code,
    item.name,
    String(item.frequencyCap),
    text.truncate(item.journeyId, 64),
    item.title,
    item.weight.toFixed(2),
    item.maximum.toFixed(2),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationMilestoneViews(items: EscalationMilestone[]): EscalationMilestoneView[] {
  const views: EscalationMilestoneView[] = [];
  for (const item of items) {
    views.push(toEscalationMilestoneView(item));
  }
  return views;
}

export function sumEscalationMilestoneView(view: EscalationMilestoneView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedFrequencyCap + parsedWeight + parsedMaximum;
}
