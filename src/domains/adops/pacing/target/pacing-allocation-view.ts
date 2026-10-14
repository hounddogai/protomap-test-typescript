import * as text from "../../../../kit/text.js";
import { PacingAllocation } from "./pacing-allocation.js";

/** How screens and exports show a pacing allocation. */
export class PacingAllocationView {
  code: string;
  nameText: string;
  campaignRef: string;
  notes: string;
  approved: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    campaignRef: string,
    notes: string,
    approved: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.campaignRef = campaignRef;
    this.notes = notes;
    this.approved = approved;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toPacingAllocationView(item: PacingAllocation): PacingAllocationView {
  return new PacingAllocationView(
    text.truncate(item.code, 40),
    item.name,
    item.campaignRef,
    item.notes,
    `${item.approved}`,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingAllocationViews(items: PacingAllocation[]): PacingAllocationView[] {
  const views: PacingAllocationView[] = [];
  for (const item of items) {
    views.push(toPacingAllocationView(item));
  }
  return views;
}

export function sumPacingAllocationView(view: PacingAllocationView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedCreatedAt;
}
