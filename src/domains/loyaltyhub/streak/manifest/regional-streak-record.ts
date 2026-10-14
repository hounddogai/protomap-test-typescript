import * as text from "../../../../kit/text.js";

/** Where a regional streak record is in its life cycle. */
export type RegionalStreakRecordStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A regional streak record as the streak team keeps it. */
export class RegionalStreakRecord {
  code: string;
  label: string;
  graceDays: number;
  batchSize: number;
  reviewer: string;
  source: string;
  summary: string;
  country: string;
  sendAt: number;
  amount: number;
  weight: number;
  status: RegionalStreakRecordStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    batchSize: number,
    reviewer: string,
    source: string,
    summary: string,
    country: string,
    sendAt: number,
    amount: number,
    weight: number,
    status: RegionalStreakRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.batchSize = batchSize;
    this.reviewer = reviewer;
    this.source = source;
    this.summary = summary;
    this.country = country;
    this.sendAt = sendAt;
    this.amount = amount;
    this.weight = weight;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalStreakRecordStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalStreakRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional streak record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"regional streak record"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.weight - this.sendAt) * 100) / 100;
  }

  copy(): RegionalStreakRecord {
    return new RegionalStreakRecord(
      this.code,
      this.label,
      this.graceDays,
      this.batchSize,
      this.reviewer,
      this.source,
      this.summary,
      this.country,
      this.sendAt,
      this.amount,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a regional streak record in status idle. */
export function newRegionalStreakRecord(code: string, label: string): RegionalStreakRecord {
  return new RegionalStreakRecord(code, label, 0, 0, "", "", "", "", 0, 0, 0, "idle");
}
