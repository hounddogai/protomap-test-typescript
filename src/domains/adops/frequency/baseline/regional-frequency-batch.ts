import * as text from "../../../../kit/text.js";

/** Where a regional frequency batch is in its life cycle. */
export type RegionalFrequencyBatchStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a regional frequency batch and its current status. */
export class RegionalFrequencyBatch {
  code: string;
  name: string;
  batchSize: number;
  graceDays: number;
  timezone: string;
  windowDays: number;
  status: RegionalFrequencyBatchStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    graceDays: number,
    timezone: string,
    windowDays: number,
    status: RegionalFrequencyBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.graceDays = graceDays;
    this.timezone = timezone;
    this.windowDays = windowDays;
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

  canMoveTo(next: RegionalFrequencyBatchStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalFrequencyBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional frequency batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveLoad(): number {
    return Math.round(this.graceDays * this.batchSize * 100) / 100;
  }

  copy(): RegionalFrequencyBatch {
    return new RegionalFrequencyBatch(
      this.code,
      this.name,
      this.batchSize,
      this.graceDays,
      this.timezone,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a regional frequency batch in status planned. */
export function newRegionalFrequencyBatch(code: string, name: string): RegionalFrequencyBatch {
  return new RegionalFrequencyBatch(code, name, 0, 0, "", 0, "planned");
}
