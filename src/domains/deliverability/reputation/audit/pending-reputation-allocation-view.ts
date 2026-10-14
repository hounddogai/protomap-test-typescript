import * as text from "../../../../kit/text.js";
import { PendingReputationAllocation } from "./pending-reputation-allocation.js";

/** How screens and exports show a pending reputation allocation. */
export class PendingReputationAllocationView {
  codeText: string;
  name: string;
  journeyId: string;
  clicks: string;
  notes: string;
  revision: string;
  expiresAt: string;
  approved: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    journeyId: string,
    clicks: string,
    notes: string,
    revision: string,
    expiresAt: string,
    approved: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.journeyId = journeyId;
    this.clicks = clicks;
    this.notes = notes;
    this.revision = revision;
    this.expiresAt = expiresAt;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toPendingReputationAllocationView(item: PendingReputationAllocation): PendingReputationAllocationView {
  return new PendingReputationAllocationView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 120),
    text.truncate(item.journeyId, 40),
    String(item.clicks),
    item.notes,
    String(item.revision),
    String(item.expiresAt),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingReputationAllocationViews(items: PendingReputationAllocation[]): PendingReputationAllocationView[] {
  const views: PendingReputationAllocationView[] = [];
  for (const item of items) {
    views.push(toPendingReputationAllocationView(item));
  }
  return views;
}

export function sumPendingReputationAllocationView(view: PendingReputationAllocationView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedClicks + parsedRevision + parsedExpiresAt;
}
