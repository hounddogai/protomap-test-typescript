import * as text from "../../../../kit/text.js";

/** Where a cohort threshold is in its life cycle. */
export type CohortThresholdStatus = "created" | "validated" | "published" | "retired";

/** A cohort threshold. Its code is unique within a tenant. */
export class CohortThreshold {
  code: string;
  label: string;
  clicks: number;
  windowDays: number;
  updatedAt: number;
  sequence: number;
  segment: string;
  unit: string;
  pinned: boolean;
  reviewer: string;
  channel: string;
  status: CohortThresholdStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    windowDays: number,
    updatedAt: number,
    sequence: number,
    segment: string,
    unit: string,
    pinned: boolean,
    reviewer: string,
    channel: string,
    status: CohortThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.windowDays = windowDays;
    this.updatedAt = updatedAt;
    this.sequence = sequence;
    this.segment = segment;
    this.unit = unit;
    this.pinned = pinned;
    this.reviewer = reviewer;
    this.channel = channel;
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

  canMoveTo(next: CohortThresholdStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: CohortThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedValue(): number {
    return Math.round((this.windowDays - this.updatedAt) * 100) / 100;
  }

  copy(): CohortThreshold {
    return new CohortThreshold(
      this.code,
      this.label,
      this.clicks,
      this.windowDays,
      this.updatedAt,
      this.sequence,
      this.segment,
      this.unit,
      this.pinned,
      this.reviewer,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a cohort threshold in status created. */
export function newCohortThreshold(code: string, label: string): CohortThreshold {
  return new CohortThreshold(code, label, 0, 0, 0, 0, "", "", false, "", "", "created");
}
