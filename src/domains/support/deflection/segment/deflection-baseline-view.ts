import * as text from "../../../../kit/text.js";
import { DeflectionBaseline } from "./deflection-baseline.js";

/** How screens and exports show a deflection baseline. */
export class DeflectionBaselineView {
  codeText: string;
  nameText: string;
  currency: string;
  sequence: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    currency: string,
    sequence: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.currency = currency;
    this.sequence = sequence;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionBaselineView(item: DeflectionBaseline): DeflectionBaselineView {
  return new DeflectionBaselineView(
    item.code,
    item.name,
    item.currency,
    String(item.sequence),
    text.truncate(item.journeyId, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionBaselineViews(items: DeflectionBaseline[]): DeflectionBaselineView[] {
  const views: DeflectionBaselineView[] = [];
  for (const item of items) {
    views.push(toDeflectionBaselineView(item));
  }
  return views;
}

export function sumDeflectionBaselineView(view: DeflectionBaselineView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedSequence;
}
