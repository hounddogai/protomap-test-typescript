import * as text from "../../../../kit/text.js";

/** Where a scheduled warmup record is in its life cycle. */
export type ScheduledWarmupRecordStatus = "new" | "queued" | "running" | "done" | "failed";

/** A scheduled warmup record as the warmup team keeps it. */
export class ScheduledWarmupRecord {
  code: string;
  label: string;
  region: string;
  journeyId: string;
  capacity: number;
  status: ScheduledWarmupRecordStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    journeyId: string,
    capacity: number,
    status: ScheduledWarmupRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.journeyId = journeyId;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledWarmupRecordStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ScheduledWarmupRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled warmup record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.capacity;
  }

  copy(): ScheduledWarmupRecord {
    return new ScheduledWarmupRecord(this.code, this.label, this.region, this.journeyId, this.capacity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a scheduled warmup record in status new. */
export function newScheduledWarmupRecord(code: string, label: string): ScheduledWarmupRecord {
  return new ScheduledWarmupRecord(code, label, "", "", 0, "new");
}
