import * as text from "../../../../kit/text.js";

/** Where a capped queue notice is in its life cycle. */
export type CappedQueueNoticeStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a capped queue notice and its current status. */
export class CappedQueueNotice {
  code: string;
  label: string;
  limit: number;
  timezone: string;
  unit: string;
  utmSource: string;
  attempts: number;
  openRate: number;
  notes: string;
  cohort: string;
  batchSize: number;
  status: CappedQueueNoticeStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    timezone: string,
    unit: string,
    utmSource: string,
    attempts: number,
    openRate: number,
    notes: string,
    cohort: string,
    batchSize: number,
    status: CappedQueueNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.timezone = timezone;
    this.unit = unit;
    this.utmSource = utmSource;
    this.attempts = attempts;
    this.openRate = openRate;
    this.notes = notes;
    this.cohort = cohort;
    this.batchSize = batchSize;
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

  canMoveTo(next: CappedQueueNoticeStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CappedQueueNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped queue notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"capped queue notice"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.openRate * this.attempts * 100) / 100;
  }

  copy(): CappedQueueNotice {
    return new CappedQueueNotice(
      this.code,
      this.label,
      this.limit,
      this.timezone,
      this.unit,
      this.utmSource,
      this.attempts,
      this.openRate,
      this.notes,
      this.cohort,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a capped queue notice in status open. */
export function newCappedQueueNotice(code: string, label: string): CappedQueueNotice {
  return new CappedQueueNotice(code, label, 0, "", "", "", 0, 0, "", "", 0, "open");
}
