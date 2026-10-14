import * as text from "../../../../kit/text.js";

/** Where a cohort review is in its life cycle. */
export type CohortReviewStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A cohort review. Its code is unique within a tenant. */
export class CohortReview {
  code: string;
  name: string;
  utmSource: string;
  batchSize: number;
  segment: string;
  ceiling: number;
  revision: number;
  rate: number;
  status: CohortReviewStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    batchSize: number,
    segment: string,
    ceiling: number,
    revision: number,
    rate: number,
    status: CohortReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.batchSize = batchSize;
    this.segment = segment;
    this.ceiling = ceiling;
    this.revision = revision;
    this.rate = rate;
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

  canMoveTo(next: CohortReviewStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        return next === "in_progress";
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

  moveTo(next: CohortReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.batchSize + this.ceiling) * 100) / 100;
  }

  copy(): CohortReview {
    return new CohortReview(
      this.code,
      this.name,
      this.utmSource,
      this.batchSize,
      this.segment,
      this.ceiling,
      this.revision,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a cohort review in status planned. */
export function newCohortReview(code: string, name: string): CohortReview {
  return new CohortReview(code, name, "", 0, "", 0, 0, 0, "planned");
}
