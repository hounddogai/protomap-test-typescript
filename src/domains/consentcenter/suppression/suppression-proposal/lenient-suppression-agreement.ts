import * as text from "../../../../kit/text.js";

/** Where a lenient suppression agreement is in its life cycle. */
export type LenientSuppressionAgreementStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A lenient suppression agreement as the suppression team keeps it. */
export class LenientSuppressionAgreement {
  code: string;
  label: string;
  capacity: number;
  score: number;
  region: string;
  frequencyCap: number;
  threshold: number;
  cohort: string;
  status: LenientSuppressionAgreementStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    score: number,
    region: string,
    frequencyCap: number,
    threshold: number,
    cohort: string,
    status: LenientSuppressionAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.score = score;
    this.region = region;
    this.frequencyCap = frequencyCap;
    this.threshold = threshold;
    this.cohort = cohort;
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

  canMoveTo(next: LenientSuppressionAgreementStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LenientSuppressionAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient suppression agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netValue(): number {
    return Math.round((this.frequencyCap + this.threshold) * 100) / 100;
  }

  copy(): LenientSuppressionAgreement {
    return new LenientSuppressionAgreement(
      this.code,
      this.label,
      this.capacity,
      this.score,
      this.region,
      this.frequencyCap,
      this.threshold,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a lenient suppression agreement in status planned. */
export function newLenientSuppressionAgreement(code: string, label: string): LenientSuppressionAgreement {
  return new LenientSuppressionAgreement(code, label, 0, 0, "", 0, 0, "", "planned");
}
