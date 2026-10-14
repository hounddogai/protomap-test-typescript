import * as text from "../../../../kit/text.js";
import { PendingReputationMapping } from "./pending-reputation-mapping.js";

/** How screens and exports show a pending reputation mapping. */
export class PendingReputationMappingView {
  code: string;
  title: string;
  archivedText: string;
  segment: string;
  reviewer: string;
  windowDays: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    archivedText: string,
    segment: string,
    reviewer: string,
    windowDays: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.archivedText = archivedText;
    this.segment = segment;
    this.reviewer = reviewer;
    this.windowDays = windowDays;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toPendingReputationMappingView(item: PendingReputationMapping): PendingReputationMappingView {
  return new PendingReputationMappingView(
    item.code,
    text.truncate(item.title, 40),
    `${item.archived}`,
    item.segment,
    text.truncate(item.reviewer, 40),
    String(item.windowDays),
    text.truncate(item.phone, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingReputationMappingViews(items: PendingReputationMapping[]): PendingReputationMappingView[] {
  const views: PendingReputationMappingView[] = [];
  for (const item of items) {
    views.push(toPendingReputationMappingView(item));
  }
  return views;
}

export function sumPendingReputationMappingView(view: PendingReputationMappingView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedWindowDays;
}
