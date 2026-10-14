/**
 * The batched ticket view claim records of support's ticket view work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched ticket view claim is in its life cycle. */
export type BatchedTicketViewClaimStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a batched ticket view claim and its current status. */
export class BatchedTicketViewClaim {
  code: string;
  title: string;
  cost: number;
  frequencyCap: number;
  ceiling: number;
  capacity: number;
  retries: number;
  impressions: number;
  category: string;
  sequence: number;
  status: BatchedTicketViewClaimStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    frequencyCap: number,
    ceiling: number,
    capacity: number,
    retries: number,
    impressions: number,
    category: string,
    sequence: number,
    status: BatchedTicketViewClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.frequencyCap = frequencyCap;
    this.ceiling = ceiling;
    this.capacity = capacity;
    this.retries = retries;
    this.impressions = impressions;
    this.category = category;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedTicketViewClaimStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BatchedTicketViewClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched ticket view claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched ticket view claim"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.ceiling + this.frequencyCap) * 100) / 100;
  }

  copy(): BatchedTicketViewClaim {
    return new BatchedTicketViewClaim(
      this.code,
      this.title,
      this.cost,
      this.frequencyCap,
      this.ceiling,
      this.capacity,
      this.retries,
      this.impressions,
      this.category,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a batched ticket view claim in status requested. */
export function newBatchedTicketViewClaim(code: string, title: string): BatchedTicketViewClaim {
  return new BatchedTicketViewClaim(code, title, 0, 0, 0, 0, 0, 0, "", 0, "requested");
}
