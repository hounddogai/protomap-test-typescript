/**
 * The batched cohort override records of growth's cohort work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched cohort override is in its life cycle. */
export type BatchedCohortOverrideStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One batched cohort override, with what the planners need to act on it. */
export class BatchedCohortOverride {
  code: string;
  name: string;
  approved: boolean;
  utmSource: string;
  segment: string;
  tags: string[];
  label: string;
  quantity: number;
  status: BatchedCohortOverrideStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    utmSource: string,
    segment: string,
    tags: string[],
    label: string,
    quantity: number,
    status: BatchedCohortOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.utmSource = utmSource;
    this.segment = segment;
    this.tags = tags;
    this.label = label;
    this.quantity = quantity;
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

  canMoveTo(next: BatchedCohortOverrideStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BatchedCohortOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched cohort override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): BatchedCohortOverride {
    return new BatchedCohortOverride(
      this.code,
      this.name,
      this.approved,
      this.utmSource,
      this.segment,
      this.tags,
      this.label,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a batched cohort override in status open. */
export function newBatchedCohortOverride(code: string, name: string): BatchedCohortOverride {
  return new BatchedCohortOverride(code, name, false, "", "", [], "", 0, "open");
}
