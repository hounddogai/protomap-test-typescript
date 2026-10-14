/**
 * The global deflection record records of support's deflection work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global deflection record is in its life cycle. */
export type GlobalDeflectionRecordStatus = "created" | "validated" | "published" | "retired";

/** The record of a global deflection record and its current status. */
export class GlobalDeflectionRecord {
  code: string;
  label: string;
  title: string;
  endsAt: number;
  maximum: number;
  rate: number;
  ceiling: number;
  version: number;
  retries: number;
  capacity: number;
  currency: string;
  status: GlobalDeflectionRecordStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    endsAt: number,
    maximum: number,
    rate: number,
    ceiling: number,
    version: number,
    retries: number,
    capacity: number,
    currency: string,
    status: GlobalDeflectionRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.endsAt = endsAt;
    this.maximum = maximum;
    this.rate = rate;
    this.ceiling = ceiling;
    this.version = version;
    this.retries = retries;
    this.capacity = capacity;
    this.currency = currency;
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

  canMoveTo(next: GlobalDeflectionRecordStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: GlobalDeflectionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global deflection record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"global deflection record"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.maximum * this.endsAt * 100) / 100;
  }

  copy(): GlobalDeflectionRecord {
    return new GlobalDeflectionRecord(
      this.code,
      this.label,
      this.title,
      this.endsAt,
      this.maximum,
      this.rate,
      this.ceiling,
      this.version,
      this.retries,
      this.capacity,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global deflection record in status created. */
export function newGlobalDeflectionRecord(code: string, label: string): GlobalDeflectionRecord {
  return new GlobalDeflectionRecord(code, label, "", 0, 0, 0, 0, 0, 0, 0, "", "created");
}
