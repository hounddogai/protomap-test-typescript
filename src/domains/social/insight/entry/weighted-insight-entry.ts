/**
 * The weighted insight entry records of social's insight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted insight entry is in its life cycle. */
export type WeightedInsightEntryStatus = "created" | "validated" | "published" | "retired";

/** A weighted insight entry as the insight team keeps it. */
export class WeightedInsightEntry {
  code: string;
  label: string;
  threshold: number;
  visible: boolean;
  expiresAt: number;
  revision: number;
  reviewer: string;
  approved: boolean;
  maximum: number;
  status: WeightedInsightEntryStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    visible: boolean,
    expiresAt: number,
    revision: number,
    reviewer: string,
    approved: boolean,
    maximum: number,
    status: WeightedInsightEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.visible = visible;
    this.expiresAt = expiresAt;
    this.revision = revision;
    this.reviewer = reviewer;
    this.approved = approved;
    this.maximum = maximum;
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

  canMoveTo(next: WeightedInsightEntryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WeightedInsightEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted insight entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netTotal(): number {
    return Math.round((this.revision + this.maximum) * 100) / 100;
  }

  copy(): WeightedInsightEntry {
    return new WeightedInsightEntry(
      this.code,
      this.label,
      this.threshold,
      this.visible,
      this.expiresAt,
      this.revision,
      this.reviewer,
      this.approved,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted insight entry in status created. */
export function newWeightedInsightEntry(code: string, label: string): WeightedInsightEntry {
  return new WeightedInsightEntry(code, label, 0, false, 0, 0, "", false, 0, "created");
}
