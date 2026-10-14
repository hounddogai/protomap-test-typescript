import * as text from "../../../../kit/text.js";
import { ReputationAllocation } from "./reputation-allocation.js";

/** How screens and exports show a reputation allocation. */
export class ReputationAllocationView {
  codeText: string;
  name: string;
  notes: string;
  active: string;
  impressions: string;
  summary: string;
  contactEmailText: string;
  graceDays: string;
  segment: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    notes: string,
    active: string,
    impressions: string,
    summary: string,
    contactEmailText: string,
    graceDays: string,
    segment: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.notes = notes;
    this.active = active;
    this.impressions = impressions;
    this.summary = summary;
    this.contactEmailText = contactEmailText;
    this.graceDays = graceDays;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toReputationAllocationView(item: ReputationAllocation): ReputationAllocationView {
  return new ReputationAllocationView(
    item.code,
    item.name,
    text.truncate(item.notes, 40),
    `${item.active}`,
    String(item.impressions),
    item.summary,
    text.truncate(item.contactEmail, 120),
    String(item.graceDays),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationAllocationViews(items: ReputationAllocation[]): ReputationAllocationView[] {
  const views: ReputationAllocationView[] = [];
  for (const item of items) {
    views.push(toReputationAllocationView(item));
  }
  return views;
}

export function sumReputationAllocationView(view: ReputationAllocationView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedImpressions + parsedGraceDays;
}
