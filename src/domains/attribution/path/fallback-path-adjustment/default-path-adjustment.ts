/**
 * The default path adjustment records of attribution's path work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default path adjustment is in its life cycle. */
export type DefaultPathAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A default path adjustment as the path team keeps it. */
export class DefaultPathAdjustment {
  code: string;
  title: string;
  graceDays: number;
  startsAt: number;
  phone: string;
  status: DefaultPathAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    startsAt: number,
    phone: string,
    status: DefaultPathAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.startsAt = startsAt;
    this.phone = phone;
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

  canMoveTo(next: DefaultPathAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
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

  moveTo(next: DefaultPathAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default path adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round(this.graceDays * this.startsAt * 100) / 100;
  }

  copy(): DefaultPathAdjustment {
    return new DefaultPathAdjustment(this.code, this.title, this.graceDays, this.startsAt, this.phone, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default path adjustment in status new. */
export function newDefaultPathAdjustment(code: string, title: string): DefaultPathAdjustment {
  return new DefaultPathAdjustment(code, title, 0, 0, "", "new");
}
