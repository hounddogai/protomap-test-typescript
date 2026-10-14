import { WeightedStepWindow } from "./weighted-step-window.js";

/** How screens and exports show a weighted step window. */
export class WeightedStepWindowView {
  codeText: string;
  label: string;
  updatedAt: string;
  locale: string;
  notesText: string;
  sequence: string;
  ceiling: string;
  margin: string;
  floorValue: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    updatedAt: string,
    locale: string,
    notesText: string,
    sequence: string,
    ceiling: string,
    margin: string,
    floorValue: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.updatedAt = updatedAt;
    this.locale = locale;
    this.notesText = notesText;
    this.sequence = sequence;
    this.ceiling = ceiling;
    this.margin = margin;
    this.floorValue = floorValue;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedStepWindowView(item: WeightedStepWindow): WeightedStepWindowView {
  return new WeightedStepWindowView(
    item.code,
    item.label,
    String(item.updatedAt),
    item.locale,
    item.notes,
    String(item.sequence),
    item.ceiling.toFixed(2),
    item.margin.toFixed(2),
    item.floorValue.toFixed(2),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedStepWindowViews(items: WeightedStepWindow[]): WeightedStepWindowView[] {
  const views: WeightedStepWindowView[] = [];
  for (const item of items) {
    views.push(toWeightedStepWindowView(item));
  }
  return views;
}

export function sumWeightedStepWindowView(view: WeightedStepWindowView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedUpdatedAt + parsedSequence + parsedCeiling;
}
