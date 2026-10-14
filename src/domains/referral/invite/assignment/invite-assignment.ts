/**
 * The invite assignment records of referral's invite work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a invite assignment is in its life cycle. */
export type InviteAssignmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A invite assignment. Its code is unique within a tenant. */
export class InviteAssignment {
  code: string;
  label: string;
  country: string;
  segment: string;
  clicks: number;
  capacity: number;
  frequencyCap: number;
  quantity: number;
  channel: string;
  batchSize: number;
  status: InviteAssignmentStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    segment: string,
    clicks: number,
    capacity: number,
    frequencyCap: number,
    quantity: number,
    channel: string,
    batchSize: number,
    status: InviteAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.segment = segment;
    this.clicks = clicks;
    this.capacity = capacity;
    this.frequencyCap = frequencyCap;
    this.quantity = quantity;
    this.channel = channel;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: InviteAssignmentStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: InviteAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedTotal(): number {
    return Math.round(this.capacity * this.clicks * 100) / 100;
  }

  copy(): InviteAssignment {
    return new InviteAssignment(
      this.code,
      this.label,
      this.country,
      this.segment,
      this.clicks,
      this.capacity,
      this.frequencyCap,
      this.quantity,
      this.channel,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a invite assignment in status new. */
export function newInviteAssignment(code: string, label: string): InviteAssignment {
  return new InviteAssignment(code, label, "", "", 0, 0, 0, 0, "", 0, "new");
}
