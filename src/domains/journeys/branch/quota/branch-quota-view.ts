import * as text from "../../../../kit/text.js";
import { BranchQuota } from "./branch-quota.js";

/** How screens and exports show a branch quota. */
export class BranchQuotaView {
  codeText: string;
  title: string;
  segment: string;
  endsAtText: string;
  notes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    segment: string,
    endsAtText: string,
    notes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.segment = segment;
    this.endsAtText = endsAtText;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toBranchQuotaView(item: BranchQuota): BranchQuotaView {
  return new BranchQuotaView(
    item.code,
    item.title,
    text.truncate(item.segment, 64),
    String(item.endsAt),
    text.truncate(item.notes, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchQuotaViews(items: BranchQuota[]): BranchQuotaView[] {
  const views: BranchQuotaView[] = [];
  for (const item of items) {
    views.push(toBranchQuotaView(item));
  }
  return views;
}

export function sumBranchQuotaView(view: BranchQuotaView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedEndsAt;
}
