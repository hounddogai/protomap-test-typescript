import * as text from "../../../../kit/text.js";
import { LevelSegment } from "./level-segment.js";

/** How screens and exports show a level segment. */
export class LevelSegmentView {
  codeText: string;
  labelText: string;
  sequenceText: string;
  ceiling: string;
  category: string;
  nameText: string;
  rate: string;
  countryText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    sequenceText: string,
    ceiling: string,
    category: string,
    nameText: string,
    rate: string,
    countryText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.sequenceText = sequenceText;
    this.ceiling = ceiling;
    this.category = category;
    this.nameText = nameText;
    this.rate = rate;
    this.countryText = countryText;
    this.statusLabel = statusLabel;
  }
}

export function toLevelSegmentView(item: LevelSegment): LevelSegmentView {
  return new LevelSegmentView(
    item.code,
    item.label,
    String(item.sequence),
    item.ceiling.toFixed(2),
    text.truncate(item.category, 40),
    item.name,
    item.rate.toFixed(2),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toLevelSegmentViews(items: LevelSegment[]): LevelSegmentView[] {
  const views: LevelSegmentView[] = [];
  for (const item of items) {
    views.push(toLevelSegmentView(item));
  }
  return views;
}

export function sumLevelSegmentView(view: LevelSegmentView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedSequence + parsedCeiling + parsedRate;
}
