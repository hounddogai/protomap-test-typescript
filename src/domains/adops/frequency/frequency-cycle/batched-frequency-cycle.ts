/**
 * The batched frequency cycle records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched frequency cycle is in its life cycle. */
export type BatchedFrequencyCycleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One batched frequency cycle, with what the planners need to act on it. */
export class BatchedFrequencyCycle {
  code: string;
  label: string;
  notes: string;
  frequencyCap: number;
  clicks: number;
  revision: number;
  summary: string;
  campaignRef: string;
  quantity: number;
  conversionRate: number;
  status: BatchedFrequencyCycleStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    frequencyCap: number,
    clicks: number,
    revision: number,
    summary: string,
    campaignRef: string,
    quantity: number,
    conversionRate: number,
    status: BatchedFrequencyCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.frequencyCap = frequencyCap;
    this.clicks = clicks;
    this.revision = revision;
    this.summary = summary;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedFrequencyCycleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BatchedFrequencyCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched frequency cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedExposure(): number {
    return Math.round((this.clicks - this.quantity) * 100) / 100;
  }

  copy(): BatchedFrequencyCycle {
    return new BatchedFrequencyCycle(
      this.code,
      this.label,
      this.notes,
      this.frequencyCap,
      this.clicks,
      this.revision,
      this.summary,
      this.campaignRef,
      this.quantity,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched frequency cycle in status draft. */
export function newBatchedFrequencyCycle(code: string, label: string): BatchedFrequencyCycle {
  return new BatchedFrequencyCycle(code, label, "", 0, 0, 0, "", "", 0, 0, "draft");
}
