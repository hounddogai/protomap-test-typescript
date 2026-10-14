/**
 * The sender rollup records of deliverability's sender work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sender rollup is in its life cycle. */
export type SenderRollupStatus = "created" | "validated" | "published" | "retired";

/** One sender rollup, with what the planners need to act on it. */
export class SenderRollup {
  code: string;
  title: string;
  windowDays: number;
  pinned: boolean;
  cohort: string;
  externalRef: string;
  bid: number;
  status: SenderRollupStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    pinned: boolean,
    cohort: string,
    externalRef: string,
    bid: number,
    status: SenderRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.pinned = pinned;
    this.cohort = cohort;
    this.externalRef = externalRef;
    this.bid = bid;
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

  canMoveTo(next: SenderRollupStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveLoad(): number {
    return Math.round(this.bid * this.windowDays * 100) / 100;
  }

  copy(): SenderRollup {
    return new SenderRollup(
      this.code,
      this.title,
      this.windowDays,
      this.pinned,
      this.cohort,
      this.externalRef,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a sender rollup in status created. */
export function newSenderRollup(code: string, title: string): SenderRollup {
  return new SenderRollup(code, title, 0, false, "", "", 0, "created");
}
