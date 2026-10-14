import * as text from "../../../../kit/text.js";
import { BatchedJourneyTemplate } from "./batched-journey-template.js";

/** How screens and exports show a batched journey template. */
export class BatchedJourneyTemplateView {
  codeText: string;
  titleText: string;
  weight: string;
  countryText: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    weight: string,
    countryText: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.weight = weight;
    this.countryText = countryText;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedJourneyTemplateView(item: BatchedJourneyTemplate): BatchedJourneyTemplateView {
  return new BatchedJourneyTemplateView(
    text.truncate(item.code, 80),
    item.title,
    item.weight.toFixed(2),
    item.country,
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedJourneyTemplateViews(items: BatchedJourneyTemplate[]): BatchedJourneyTemplateView[] {
  const views: BatchedJourneyTemplateView[] = [];
  for (const item of items) {
    views.push(toBatchedJourneyTemplateView(item));
  }
  return views;
}

export function sumBatchedJourneyTemplateView(view: BatchedJourneyTemplateView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedWeight;
}
