import * as text from "../../../../kit/text.js";

/** Where a adaptive branch summary is in its life cycle. */
export type AdaptiveBranchSummaryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A adaptive branch summary as the branch team keeps it. */
export class AdaptiveBranchSummary {
  code: string;
  label: string;
  unit: string;
  windowDays: number;
  notes: string;
  ceiling: number;
  budget: number;
  status: AdaptiveBranchSummaryStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    windowDays: number,
    notes: string,
    ceiling: number,
    budget: number,
    status: AdaptiveBranchSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.windowDays = windowDays;
    this.notes = notes;
    this.ceiling = ceiling;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveBranchSummaryStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: AdaptiveBranchSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive branch summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedValue(): number {
    return Math.round(this.budget * this.windowDays * 100) / 100;
  }

  copy(): AdaptiveBranchSummary {
    return new AdaptiveBranchSummary(
      this.code,
      this.label,
      this.unit,
      this.windowDays,
      this.notes,
      this.ceiling,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a adaptive branch summary in status planned. */
export function newAdaptiveBranchSummary(code: string, label: string): AdaptiveBranchSummary {
  return new AdaptiveBranchSummary(code, label, "", 0, "", 0, 0, "planned");
}
