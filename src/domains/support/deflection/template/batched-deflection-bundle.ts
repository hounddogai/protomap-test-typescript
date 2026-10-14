import * as text from "../../../../kit/text.js";

/** Where a batched deflection bundle is in its life cycle. */
export type BatchedDeflectionBundleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A batched deflection bundle as the deflection team keeps it. */
export class BatchedDeflectionBundle {
  code: string;
  label: string;
  cohort: string;
  frequencyCap: number;
  ceiling: number;
  budget: number;
  status: BatchedDeflectionBundleStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    frequencyCap: number,
    ceiling: number,
    budget: number,
    status: BatchedDeflectionBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.frequencyCap = frequencyCap;
    this.ceiling = ceiling;
    this.budget = budget;
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

  canMoveTo(next: BatchedDeflectionBundleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedDeflectionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched deflection bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"batched deflection bundle"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.frequencyCap - this.budget) * 100) / 100;
  }

  copy(): BatchedDeflectionBundle {
    return new BatchedDeflectionBundle(
      this.code,
      this.label,
      this.cohort,
      this.frequencyCap,
      this.ceiling,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched deflection bundle in status open. */
export function newBatchedDeflectionBundle(code: string, label: string): BatchedDeflectionBundle {
  return new BatchedDeflectionBundle(code, label, "", 0, 0, 0, "open");
}
