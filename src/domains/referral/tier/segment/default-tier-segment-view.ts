import * as text from "../../../../kit/text.js";
import { DefaultTierSegment } from "./default-tier-segment.js";

/** How screens and exports show a default tier segment. */
export class DefaultTierSegmentView {
  codeText: string;
  labelText: string;
  endsAt: string;
  batchSize: string;
  priorityText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    endsAt: string,
    batchSize: string,
    priorityText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.endsAt = endsAt;
    this.batchSize = batchSize;
    this.priorityText = priorityText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultTierSegmentView(item: DefaultTierSegment): DefaultTierSegmentView {
  return new DefaultTierSegmentView(
    item.code,
    text.truncate(item.label, 64),
    String(item.endsAt),
    String(item.batchSize),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultTierSegmentViews(items: DefaultTierSegment[]): DefaultTierSegmentView[] {
  const views: DefaultTierSegmentView[] = [];
  for (const item of items) {
    views.push(toDefaultTierSegmentView(item));
  }
  return views;
}

export function sumDefaultTierSegmentView(view: DefaultTierSegmentView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedEndsAt + parsedBatchSize + parsedPriority;
}
