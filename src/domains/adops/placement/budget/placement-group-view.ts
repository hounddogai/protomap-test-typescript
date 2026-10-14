import * as text from "../../../../kit/text.js";
import { PlacementGroup } from "./placement-group.js";

/** How screens and exports show a placement group. */
export class PlacementGroupView {
  code: string;
  label: string;
  source: string;
  journeyId: string;
  sequence: string;
  priority: string;
  weightText: string;
  channel: string;
  limit: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    source: string,
    journeyId: string,
    sequence: string,
    priority: string,
    weightText: string,
    channel: string,
    limit: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.journeyId = journeyId;
    this.sequence = sequence;
    this.priority = priority;
    this.weightText = weightText;
    this.channel = channel;
    this.limit = limit;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementGroupView(item: PlacementGroup): PlacementGroupView {
  return new PlacementGroupView(
    item.code,
    item.label,
    item.source,
    text.truncate(item.journeyId, 40),
    String(item.sequence),
    String(item.priority),
    item.weight.toFixed(2),
    text.truncate(item.channel, 80),
    String(item.limit),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementGroupViews(items: PlacementGroup[]): PlacementGroupView[] {
  const views: PlacementGroupView[] = [];
  for (const item of items) {
    views.push(toPlacementGroupView(item));
  }
  return views;
}

export function sumPlacementGroupView(view: PlacementGroupView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedSequence + parsedPriority + parsedWeight;
}
