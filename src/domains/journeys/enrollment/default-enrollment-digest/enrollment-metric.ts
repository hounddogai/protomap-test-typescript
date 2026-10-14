import * as text from "../../../../kit/text.js";

/** Where a enrollment metric is in its life cycle. */
export type EnrollmentMetricStatus = "created" | "validated" | "published" | "retired";

/** A enrollment metric. Its code is unique within a tenant. */
export class EnrollmentMetric {
  code: string;
  name: string;
  score: number;
  maximum: number;
  cohort: string;
  channel: string;
  reviewer: string;
  pinned: boolean;
  revision: number;
  status: EnrollmentMetricStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    maximum: number,
    cohort: string,
    channel: string,
    reviewer: string,
    pinned: boolean,
    revision: number,
    status: EnrollmentMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.maximum = maximum;
    this.cohort = cohort;
    this.channel = channel;
    this.reviewer = reviewer;
    this.pinned = pinned;
    this.revision = revision;
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

  canMoveTo(next: EnrollmentMetricStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: EnrollmentMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedExposure(): number {
    return Math.round(this.revision * this.maximum * 100) / 100;
  }

  copy(): EnrollmentMetric {
    return new EnrollmentMetric(
      this.code,
      this.name,
      this.score,
      this.maximum,
      this.cohort,
      this.channel,
      this.reviewer,
      this.pinned,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a enrollment metric in status created. */
export function newEnrollmentMetric(code: string, name: string): EnrollmentMetric {
  return new EnrollmentMetric(code, name, 0, 0, "", "", "", false, 0, "created");
}
