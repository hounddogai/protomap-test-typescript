/**
 * The strict model record records of attribution's model work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict model record is in its life cycle. */
export type StrictModelRecordStatus = "new" | "queued" | "running" | "done" | "failed";

/** A strict model record as the model team keeps it. */
export class StrictModelRecord {
  code: string;
  name: string;
  locale: string;
  quantity: number;
  graceDays: number;
  phone: string;
  clicks: number;
  status: StrictModelRecordStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    quantity: number,
    graceDays: number,
    phone: string,
    clicks: number,
    status: StrictModelRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.quantity = quantity;
    this.graceDays = graceDays;
    this.phone = phone;
    this.clicks = clicks;
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

  canMoveTo(next: StrictModelRecordStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictModelRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict model record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict model record"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.clicks * this.graceDays * 100) / 100;
  }

  copy(): StrictModelRecord {
    return new StrictModelRecord(
      this.code,
      this.name,
      this.locale,
      this.quantity,
      this.graceDays,
      this.phone,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict model record in status new. */
export function newStrictModelRecord(code: string, name: string): StrictModelRecord {
  return new StrictModelRecord(code, name, "", 0, 0, "", 0, "new");
}
