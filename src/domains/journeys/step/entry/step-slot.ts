import * as text from "../../../../kit/text.js";

/** Where a step slot is in its life cycle. */
export type StepSlotStatus = "new" | "queued" | "running" | "done" | "failed";

/** A step slot. Its code is unique within a tenant. */
export class StepSlot {
  code: string;
  name: string;
  bid: number;
  notes: string;
  windowDays: number;
  reviewer: string;
  rate: number;
  summary: string;
  timezone: string;
  region: string;
  status: StepSlotStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    notes: string,
    windowDays: number,
    reviewer: string,
    rate: number,
    summary: string,
    timezone: string,
    region: string,
    status: StepSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.notes = notes;
    this.windowDays = windowDays;
    this.reviewer = reviewer;
    this.rate = rate;
    this.summary = summary;
    this.timezone = timezone;
    this.region = region;
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

  canMoveTo(next: StepSlotStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StepSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"step slot"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.bid + this.windowDays) * 100) / 100;
  }

  copy(): StepSlot {
    return new StepSlot(
      this.code,
      this.name,
      this.bid,
      this.notes,
      this.windowDays,
      this.reviewer,
      this.rate,
      this.summary,
      this.timezone,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a step slot in status new. */
export function newStepSlot(code: string, name: string): StepSlot {
  return new StepSlot(code, name, 0, "", 0, "", 0, "", "", "", "new");
}
