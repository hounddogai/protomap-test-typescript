import * as text from "../../../../kit/text.js";
import { WeightedSlaMapping } from "./weighted-sla-mapping.js";

/** How screens and exports show a weighted sla mapping. */
export class WeightedSlaMappingView {
  code: string;
  name: string;
  visible: string;
  audienceId: string;
  summary: string;
  sequenceText: string;
  active: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    visible: string,
    audienceId: string,
    summary: string,
    sequenceText: string,
    active: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.audienceId = audienceId;
    this.summary = summary;
    this.sequenceText = sequenceText;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedSlaMappingView(item: WeightedSlaMapping): WeightedSlaMappingView {
  return new WeightedSlaMappingView(
    item.code,
    text.truncate(item.name, 64),
    `${item.visible}`,
    item.audienceId,
    item.summary,
    String(item.sequence),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedSlaMappingViews(items: WeightedSlaMapping[]): WeightedSlaMappingView[] {
  const views: WeightedSlaMappingView[] = [];
  for (const item of items) {
    views.push(toWeightedSlaMappingView(item));
  }
  return views;
}

export function sumWeightedSlaMappingView(view: WeightedSlaMappingView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedSequence;
}
