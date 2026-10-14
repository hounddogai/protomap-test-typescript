/**
 * The batched bounce preference records of deliverability's bounce work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched bounce preference is in its life cycle. */
export type BatchedBouncePreferenceStatus = "requested" | "granted" | "revoked" | "expired";

/** One batched bounce preference, with what the planners need to act on it. */
export class BatchedBouncePreference {
  code: string;
  label: string;
  bid: number;
  graceDays: number;
  revision: number;
  frequencyCap: number;
  budget: number;
  status: BatchedBouncePreferenceStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    graceDays: number,
    revision: number,
    frequencyCap: number,
    budget: number,
    status: BatchedBouncePreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.graceDays = graceDays;
    this.revision = revision;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
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

  canMoveTo(next: BatchedBouncePreferenceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BatchedBouncePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched bounce preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"batched bounce preference"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.bid * this.budget * 100) / 100;
  }

  copy(): BatchedBouncePreference {
    return new BatchedBouncePreference(
      this.code,
      this.label,
      this.bid,
      this.graceDays,
      this.revision,
      this.frequencyCap,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched bounce preference in status requested. */
export function newBatchedBouncePreference(code: string, label: string): BatchedBouncePreference {
  return new BatchedBouncePreference(code, label, 0, 0, 0, 0, 0, "requested");
}
