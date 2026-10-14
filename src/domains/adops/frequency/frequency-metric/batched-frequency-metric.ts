/**
 * The batched frequency metric records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched frequency metric is in its life cycle. */
export type BatchedFrequencyMetricStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a batched frequency metric and its current status. */
export class BatchedFrequencyMetric {
  code: string;
  label: string;
  budget: number;
  source: string;
  clicks: number;
  status: BatchedFrequencyMetricStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    source: string,
    clicks: number,
    status: BatchedFrequencyMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.source = source;
    this.clicks = clicks;
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

  canMoveTo(next: BatchedFrequencyMetricStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedFrequencyMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched frequency metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"batched frequency metric"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.clicks * this.budget * 100) / 100;
  }

  copy(): BatchedFrequencyMetric {
    return new BatchedFrequencyMetric(this.code, this.label, this.budget, this.source, this.clicks, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a batched frequency metric in status requested. */
export function newBatchedFrequencyMetric(code: string, label: string): BatchedFrequencyMetric {
  return new BatchedFrequencyMetric(code, label, 0, "", 0, "requested");
}
