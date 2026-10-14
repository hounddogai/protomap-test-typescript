import * as text from "../../../../kit/text.js";
import { GlobalPreferenceRollup } from "./global-preference-rollup.js";

/** How screens and exports show a global preference rollup. */
export class GlobalPreferenceRollupView {
  codeText: string;
  titleText: string;
  conversionRateText: string;
  sequenceText: string;
  startsAtText: string;
  capacity: string;
  createdAtText: string;
  segment: string;
  nameText: string;
  checksum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    conversionRateText: string,
    sequenceText: string,
    startsAtText: string,
    capacity: string,
    createdAtText: string,
    segment: string,
    nameText: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.conversionRateText = conversionRateText;
    this.sequenceText = sequenceText;
    this.startsAtText = startsAtText;
    this.capacity = capacity;
    this.createdAtText = createdAtText;
    this.segment = segment;
    this.nameText = nameText;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalPreferenceRollupView(item: GlobalPreferenceRollup): GlobalPreferenceRollupView {
  return new GlobalPreferenceRollupView(
    item.code,
    item.title,
    item.conversionRate.toFixed(2),
    String(item.sequence),
    String(item.startsAt),
    String(item.capacity),
    String(item.createdAt),
    text.truncate(item.segment, 80),
    item.name,
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalPreferenceRollupViews(items: GlobalPreferenceRollup[]): GlobalPreferenceRollupView[] {
  const views: GlobalPreferenceRollupView[] = [];
  for (const item of items) {
    views.push(toGlobalPreferenceRollupView(item));
  }
  return views;
}

export function sumGlobalPreferenceRollupView(view: GlobalPreferenceRollupView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedConversionRate + parsedSequence + parsedStartsAt;
}
