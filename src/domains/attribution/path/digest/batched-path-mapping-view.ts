import * as text from "../../../../kit/text.js";
import { BatchedPathMapping } from "./batched-path-mapping.js";

/** How screens and exports show a batched path mapping. */
export class BatchedPathMappingView {
  code: string;
  label: string;
  windowDaysText: string;
  visible: string;
  title: string;
  contactEmail: string;
  ownerIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    windowDaysText: string,
    visible: string,
    title: string,
    contactEmail: string,
    ownerIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.windowDaysText = windowDaysText;
    this.visible = visible;
    this.title = title;
    this.contactEmail = contactEmail;
    this.ownerIdText = ownerIdText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedPathMappingView(item: BatchedPathMapping): BatchedPathMappingView {
  return new BatchedPathMappingView(
    item.code,
    text.truncate(item.label, 120),
    String(item.windowDays),
    `${item.visible}`,
    item.title,
    item.contactEmail,
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedPathMappingViews(items: BatchedPathMapping[]): BatchedPathMappingView[] {
  const views: BatchedPathMappingView[] = [];
  for (const item of items) {
    views.push(toBatchedPathMappingView(item));
  }
  return views;
}

export function sumBatchedPathMappingView(view: BatchedPathMappingView): number {
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedWindowDays;
}
