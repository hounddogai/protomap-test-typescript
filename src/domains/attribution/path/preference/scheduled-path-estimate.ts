import * as text from "../../../../kit/text.js";

/** Where a scheduled path estimate is in its life cycle. */
export type ScheduledPathEstimateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A scheduled path estimate. Its code is unique within a tenant. */
export class ScheduledPathEstimate {
  code: string;
  title: string;
  label: string;
  segment: string;
  batchSize: number;
  sequence: number;
  currency: string;
  reviewer: string;
  status: ScheduledPathEstimateStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    segment: string,
    batchSize: number,
    sequence: number,
    currency: string,
    reviewer: string,
    status: ScheduledPathEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.segment = segment;
    this.batchSize = batchSize;
    this.sequence = sequence;
    this.currency = currency;
    this.reviewer = reviewer;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledPathEstimateStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ScheduledPathEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled path estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round(this.sequence * this.batchSize * 100) / 100;
  }

  copy(): ScheduledPathEstimate {
    return new ScheduledPathEstimate(
      this.code,
      this.title,
      this.label,
      this.segment,
      this.batchSize,
      this.sequence,
      this.currency,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a scheduled path estimate in status proposed. */
export function newScheduledPathEstimate(code: string, title: string): ScheduledPathEstimate {
  return new ScheduledPathEstimate(code, title, "", "", 0, 0, "", "", "proposed");
}
