/**
 * The weighted insight snapshot records of social's insight work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted insight snapshot is in its life cycle. */
export type WeightedInsightSnapshotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A weighted insight snapshot as the insight team keeps it. */
export class WeightedInsightSnapshot {
  code: string;
  label: string;
  revision: number;
  impressions: number;
  attempts: number;
  name: string;
  budget: number;
  batchSize: number;
  status: WeightedInsightSnapshotStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    impressions: number,
    attempts: number,
    name: string,
    budget: number,
    batchSize: number,
    status: WeightedInsightSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.impressions = impressions;
    this.attempts = attempts;
    this.name = name;
    this.budget = budget;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedInsightSnapshotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: WeightedInsightSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted insight snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"weighted insight snapshot"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round(this.budget * this.attempts * 100) / 100;
  }

  copy(): WeightedInsightSnapshot {
    return new WeightedInsightSnapshot(
      this.code,
      this.label,
      this.revision,
      this.impressions,
      this.attempts,
      this.name,
      this.budget,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted insight snapshot in status proposed. */
export function newWeightedInsightSnapshot(code: string, label: string): WeightedInsightSnapshot {
  return new WeightedInsightSnapshot(code, label, 0, 0, 0, "", 0, 0, "proposed");
}
