/**
 * The cohort batch records of growth's cohort work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a cohort batch is in its life cycle. */
export type CohortBatchStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A cohort batch as the cohort team keeps it. */
export class CohortBatch {
  code: string;
  name: string;
  attributes: Map<string, string>;
  expiresAt: number;
  floorValue: number;
  cohort: string;
  threshold: number;
  status: CohortBatchStatus;

  constructor(
    code: string,
    name: string,
    attributes: Map<string, string>,
    expiresAt: number,
    floorValue: number,
    cohort: string,
    threshold: number,
    status: CohortBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attributes = attributes;
    this.expiresAt = expiresAt;
    this.floorValue = floorValue;
    this.cohort = cohort;
    this.threshold = threshold;
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

  canMoveTo(next: CohortBatchStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CohortBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveValue(): number {
    return Math.round(this.threshold * this.floorValue * 100) / 100;
  }

  copy(): CohortBatch {
    return new CohortBatch(
      this.code,
      this.name,
      this.attributes,
      this.expiresAt,
      this.floorValue,
      this.cohort,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a cohort batch in status draft. */
export function newCohortBatch(code: string, name: string): CohortBatch {
  return new CohortBatch(code, name, new Map<string, string>(), 0, 0, "", 0, "draft");
}
