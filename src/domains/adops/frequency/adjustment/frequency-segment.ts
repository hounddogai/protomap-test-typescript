import * as text from "../../../../kit/text.js";

/** Where a frequency segment is in its life cycle. */
export type FrequencySegmentStatus = "created" | "validated" | "published" | "retired";

/** A frequency segment as the frequency team keeps it. */
export class FrequencySegment {
  code: string;
  label: string;
  budget: number;
  threshold: number;
  cohort: string;
  frequencyCap: number;
  discount: number;
  status: FrequencySegmentStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    threshold: number,
    cohort: string,
    frequencyCap: number,
    discount: number,
    status: FrequencySegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.threshold = threshold;
    this.cohort = cohort;
    this.frequencyCap = frequencyCap;
    this.discount = discount;
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

  canMoveTo(next: FrequencySegmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FrequencySegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round((this.frequencyCap - this.discount) * 100) / 100;
  }

  copy(): FrequencySegment {
    return new FrequencySegment(
      this.code,
      this.label,
      this.budget,
      this.threshold,
      this.cohort,
      this.frequencyCap,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a frequency segment in status created. */
export function newFrequencySegment(code: string, label: string): FrequencySegment {
  return new FrequencySegment(code, label, 0, 0, "", 0, 0, "created");
}
