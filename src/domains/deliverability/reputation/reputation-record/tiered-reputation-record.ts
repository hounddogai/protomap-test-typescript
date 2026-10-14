/**
 * The tiered reputation record records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered reputation record is in its life cycle. */
export type TieredReputationRecordStatus = "created" | "validated" | "published" | "retired";

/** The record of a tiered reputation record and its current status. */
export class TieredReputationRecord {
  code: string;
  name: string;
  source: string;
  unit: string;
  startsAt: number;
  archived: boolean;
  revision: number;
  createdAt: number;
  amount: number;
  region: string;
  capacity: number;
  status: TieredReputationRecordStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    unit: string,
    startsAt: number,
    archived: boolean,
    revision: number,
    createdAt: number,
    amount: number,
    region: string,
    capacity: number,
    status: TieredReputationRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.unit = unit;
    this.startsAt = startsAt;
    this.archived = archived;
    this.revision = revision;
    this.createdAt = createdAt;
    this.amount = amount;
    this.region = region;
    this.capacity = capacity;
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

  canMoveTo(next: TieredReputationRecordStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredReputationRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reputation record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"tiered reputation record"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.revision - this.startsAt) * 100) / 100;
  }

  copy(): TieredReputationRecord {
    return new TieredReputationRecord(
      this.code,
      this.name,
      this.source,
      this.unit,
      this.startsAt,
      this.archived,
      this.revision,
      this.createdAt,
      this.amount,
      this.region,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered reputation record in status created. */
export function newTieredReputationRecord(code: string, name: string): TieredReputationRecord {
  return new TieredReputationRecord(code, name, "", "", 0, false, 0, 0, 0, "", 0, "created");
}
