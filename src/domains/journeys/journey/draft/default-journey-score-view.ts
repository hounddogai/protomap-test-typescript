import * as text from "../../../../kit/text.js";
import { DefaultJourneyScore } from "./default-journey-score.js";

/** How screens and exports show a default journey score. */
export class DefaultJourneyScoreView {
  code: string;
  name: string;
  localeText: string;
  externalRef: string;
  active: string;
  description: string;
  journeyId: string;
  notes: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    localeText: string,
    externalRef: string,
    active: string,
    description: string,
    journeyId: string,
    notes: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.localeText = localeText;
    this.externalRef = externalRef;
    this.active = active;
    this.description = description;
    this.journeyId = journeyId;
    this.notes = notes;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultJourneyScoreView(item: DefaultJourneyScore): DefaultJourneyScoreView {
  return new DefaultJourneyScoreView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 64),
    text.truncate(item.locale, 120),
    item.externalRef,
    `${item.active}`,
    item.description,
    item.journeyId,
    item.notes,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultJourneyScoreViews(items: DefaultJourneyScore[]): DefaultJourneyScoreView[] {
  const views: DefaultJourneyScoreView[] = [];
  for (const item of items) {
    views.push(toDefaultJourneyScoreView(item));
  }
  return views;
}

export function sumDefaultJourneyScoreView(view: DefaultJourneyScoreView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
