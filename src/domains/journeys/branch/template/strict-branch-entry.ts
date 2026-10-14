import * as text from "../../../../kit/text.js";

/** Where a strict branch entry is in its life cycle. */
export type StrictBranchEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A strict branch entry. Its code is unique within a tenant. */
export class StrictBranchEntry {
  code: string;
  label: string;
  threshold: number;
  quantity: number;
  clicks: number;
  segment: string;
  frequencyCap: number;
  budget: number;
  archived: boolean;
  status: StrictBranchEntryStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    quantity: number,
    clicks: number,
    segment: string,
    frequencyCap: number,
    budget: number,
    archived: boolean,
    status: StrictBranchEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.quantity = quantity;
    this.clicks = clicks;
    this.segment = segment;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.archived = archived;
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

  canMoveTo(next: StrictBranchEntryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StrictBranchEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict branch entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveExposure(): number {
    return Math.round(this.budget * this.quantity * 100) / 100;
  }

  copy(): StrictBranchEntry {
    return new StrictBranchEntry(
      this.code,
      this.label,
      this.threshold,
      this.quantity,
      this.clicks,
      this.segment,
      this.frequencyCap,
      this.budget,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a strict branch entry in status open. */
export function newStrictBranchEntry(code: string, label: string): StrictBranchEntry {
  return new StrictBranchEntry(code, label, 0, 0, 0, "", 0, 0, false, "open");
}
