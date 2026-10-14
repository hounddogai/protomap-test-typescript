import * as text from "../../../../kit/text.js";
import { BatchedDomainSegment } from "./batched-domain-segment.js";

/** How screens and exports show a batched domain segment. */
export class BatchedDomainSegmentView {
  code: string;
  label: string;
  endsAtText: string;
  phone: string;
  frequencyCap: string;
  priority: string;
  windowDays: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    endsAtText: string,
    phone: string,
    frequencyCap: string,
    priority: string,
    windowDays: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.endsAtText = endsAtText;
    this.phone = phone;
    this.frequencyCap = frequencyCap;
    this.priority = priority;
    this.windowDays = windowDays;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedDomainSegmentView(item: BatchedDomainSegment): BatchedDomainSegmentView {
  return new BatchedDomainSegmentView(
    text.truncate(item.code, 64),
    item.label,
    String(item.endsAt),
    item.phone,
    String(item.frequencyCap),
    String(item.priority),
    String(item.windowDays),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedDomainSegmentViews(items: BatchedDomainSegment[]): BatchedDomainSegmentView[] {
  const views: BatchedDomainSegmentView[] = [];
  for (const item of items) {
    views.push(toBatchedDomainSegmentView(item));
  }
  return views;
}

export function sumBatchedDomainSegmentView(view: BatchedDomainSegmentView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedEndsAt + parsedFrequencyCap + parsedPriority;
}
