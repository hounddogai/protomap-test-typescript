import * as text from "../../../../kit/text.js";

/** Where a fallback path adjustment is in its life cycle. */
export type FallbackPathAdjustmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A fallback path adjustment as the path team keeps it. */
export class FallbackPathAdjustment {
  code: string;
  label: string;
  unit: string;
  cohort: string;
  threshold: number;
  retries: number;
  status: FallbackPathAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    cohort: string,
    threshold: number,
    retries: number,
    status: FallbackPathAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.cohort = cohort;
    this.threshold = threshold;
    this.retries = retries;
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

  canMoveTo(next: FallbackPathAdjustmentStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: FallbackPathAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback path adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback path adjustment"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.retries - this.threshold) * 100) / 100;
  }

  copy(): FallbackPathAdjustment {
    return new FallbackPathAdjustment(
      this.code,
      this.label,
      this.unit,
      this.cohort,
      this.threshold,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a fallback path adjustment in status draft. */
export function newFallbackPathAdjustment(code: string, label: string): FallbackPathAdjustment {
  return new FallbackPathAdjustment(code, label, "", "", 0, 0, "draft");
}
