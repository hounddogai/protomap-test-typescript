/**
 * The capped branch metric records of journeys's branch work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped branch metric is in its life cycle. */
export type CappedBranchMetricStatus = "created" | "validated" | "published" | "retired";

/** The record of a capped branch metric and its current status. */
export class CappedBranchMetric {
  code: string;
  label: string;
  budget: number;
  graceDays: number;
  region: string;
  category: string;
  status: CappedBranchMetricStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    graceDays: number,
    region: string,
    category: string,
    status: CappedBranchMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.graceDays = graceDays;
    this.region = region;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedBranchMetricStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedBranchMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped branch metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round((this.budget + this.graceDays) * 100) / 100;
  }

  copy(): CappedBranchMetric {
    return new CappedBranchMetric(
      this.code,
      this.label,
      this.budget,
      this.graceDays,
      this.region,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a capped branch metric in status created. */
export function newCappedBranchMetric(code: string, label: string): CappedBranchMetric {
  return new CappedBranchMetric(code, label, 0, 0, "", "", "created");
}
