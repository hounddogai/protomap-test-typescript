/**
 * The batched macro policy records of support's macro work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched macro policy is in its life cycle. */
export type BatchedMacroPolicyStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A batched macro policy as the macro team keeps it. */
export class BatchedMacroPolicy {
  code: string;
  label: string;
  score: number;
  locale: string;
  impressions: number;
  reviewer: string;
  revision: number;
  clicks: number;
  status: BatchedMacroPolicyStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    locale: string,
    impressions: number,
    reviewer: string,
    revision: number,
    clicks: number,
    status: BatchedMacroPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.locale = locale;
    this.impressions = impressions;
    this.reviewer = reviewer;
    this.revision = revision;
    this.clicks = clicks;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedMacroPolicyStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedMacroPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched macro policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.impressions - this.score) * 100) / 100;
  }

  copy(): BatchedMacroPolicy {
    return new BatchedMacroPolicy(
      this.code,
      this.label,
      this.score,
      this.locale,
      this.impressions,
      this.reviewer,
      this.revision,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched macro policy in status open. */
export function newBatchedMacroPolicy(code: string, label: string): BatchedMacroPolicy {
  return new BatchedMacroPolicy(code, label, 0, "", 0, "", 0, 0, "open");
}
