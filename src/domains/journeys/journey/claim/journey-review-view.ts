import * as text from "../../../../kit/text.js";
import { JourneyReview } from "./journey-review.js";

/** How screens and exports show a journey review. */
export class JourneyReviewView {
  codeText: string;
  titleText: string;
  audienceIdText: string;
  description: string;
  cost: string;
  sequence: string;
  visible: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    audienceIdText: string,
    description: string,
    cost: string,
    sequence: string,
    visible: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.audienceIdText = audienceIdText;
    this.description = description;
    this.cost = cost;
    this.sequence = sequence;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyReviewView(item: JourneyReview): JourneyReviewView {
  return new JourneyReviewView(
    text.truncate(item.code, 80),
    item.title,
    item.audienceId,
    item.description,
    item.cost.toFixed(2),
    String(item.sequence),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyReviewViews(items: JourneyReview[]): JourneyReviewView[] {
  const views: JourneyReviewView[] = [];
  for (const item of items) {
    views.push(toJourneyReviewView(item));
  }
  return views;
}

export function sumJourneyReviewView(view: JourneyReviewView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedCost + parsedSequence;
}
