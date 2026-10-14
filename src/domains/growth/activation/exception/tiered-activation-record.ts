import * as text from "../../../../kit/text.js";

/** Where a tiered activation record is in its life cycle. */
export type TieredActivationRecordStatus = "created" | "validated" | "published" | "retired";

/** The record of a tiered activation record and its current status. */
export class TieredActivationRecord {
  code: string;
  title: string;
  timezone: string;
  bid: number;
  quantity: number;
  margin: number;
  source: string;
  ownerId: string;
  cohort: string;
  status: TieredActivationRecordStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    bid: number,
    quantity: number,
    margin: number,
    source: string,
    ownerId: string,
    cohort: string,
    status: TieredActivationRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.bid = bid;
    this.quantity = quantity;
    this.margin = margin;
    this.source = source;
    this.ownerId = ownerId;
    this.cohort = cohort;
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

  canMoveTo(next: TieredActivationRecordStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TieredActivationRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered activation record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tiered activation record"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.quantity - this.margin) * 100) / 100;
  }

  copy(): TieredActivationRecord {
    return new TieredActivationRecord(
      this.code,
      this.title,
      this.timezone,
      this.bid,
      this.quantity,
      this.margin,
      this.source,
      this.ownerId,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered activation record in status created. */
export function newTieredActivationRecord(code: string, title: string): TieredActivationRecord {
  return new TieredActivationRecord(code, title, "", 0, 0, 0, "", "", "", "created");
}
