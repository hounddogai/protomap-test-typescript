import { DefaultPreferenceSegment } from "./default-preference-segment.js";

/** How screens and exports show a default preference segment. */
export class DefaultPreferenceSegmentView {
  code: string;
  name: string;
  label: string;
  visible: string;
  amount: string;
  margin: string;
  thresholdText: string;
  pinned: string;
  audienceId: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    label: string,
    visible: string,
    amount: string,
    margin: string,
    thresholdText: string,
    pinned: string,
    audienceId: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.visible = visible;
    this.amount = amount;
    this.margin = margin;
    this.thresholdText = thresholdText;
    this.pinned = pinned;
    this.audienceId = audienceId;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultPreferenceSegmentView(item: DefaultPreferenceSegment): DefaultPreferenceSegmentView {
  return new DefaultPreferenceSegmentView(
    item.code,
    item.name,
    item.label,
    `${item.visible}`,
    item.amount.toFixed(2),
    item.margin.toFixed(2),
    item.threshold.toFixed(2),
    `${item.pinned}`,
    item.audienceId,
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultPreferenceSegmentViews(items: DefaultPreferenceSegment[]): DefaultPreferenceSegmentView[] {
  const views: DefaultPreferenceSegmentView[] = [];
  for (const item of items) {
    views.push(toDefaultPreferenceSegmentView(item));
  }
  return views;
}

export function sumDefaultPreferenceSegmentView(view: DefaultPreferenceSegmentView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedAmount + parsedMargin + parsedThreshold;
}
