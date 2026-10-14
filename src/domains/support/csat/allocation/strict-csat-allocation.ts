/**
 * The strict csat allocation records of support's csat work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict csat allocation is in its life cycle. */
export type StrictCsatAllocationStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict csat allocation as the csat team keeps it. */
export class StrictCsatAllocation {
  code: string;
  label: string;
  reviewer: string;
  retries: number;
  category: string;
  summary: string;
  checksum: string;
  rate: number;
  budget: number;
  attributes: Map<string, string>;
  status: StrictCsatAllocationStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    retries: number,
    category: string,
    summary: string,
    checksum: string,
    rate: number,
    budget: number,
    attributes: Map<string, string>,
    status: StrictCsatAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.retries = retries;
    this.category = category;
    this.summary = summary;
    this.checksum = checksum;
    this.rate = rate;
    this.budget = budget;
    this.attributes = attributes;
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

  canMoveTo(next: StrictCsatAllocationStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StrictCsatAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict csat allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"strict csat allocation"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedTotal(): number {
    return Math.round((this.rate - this.retries) * 100) / 100;
  }

  copy(): StrictCsatAllocation {
    return new StrictCsatAllocation(
      this.code,
      this.label,
      this.reviewer,
      this.retries,
      this.category,
      this.summary,
      this.checksum,
      this.rate,
      this.budget,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a strict csat allocation in status requested. */
export function newStrictCsatAllocation(code: string, label: string): StrictCsatAllocation {
  return new StrictCsatAllocation(code, label, "", 0, "", "", "", 0, 0, new Map<string, string>(), "requested");
}
