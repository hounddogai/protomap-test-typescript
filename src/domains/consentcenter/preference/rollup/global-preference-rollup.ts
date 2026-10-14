/**
 * The global preference rollup records of consentcenter's preference work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global preference rollup is in its life cycle. */
export type GlobalPreferenceRollupStatus = "new" | "queued" | "running" | "done" | "failed";

/** One global preference rollup, with what the planners need to act on it. */
export class GlobalPreferenceRollup {
  code: string;
  title: string;
  conversionRate: number;
  sequence: number;
  startsAt: number;
  capacity: number;
  createdAt: number;
  segment: string;
  name: string;
  checksum: string;
  status: GlobalPreferenceRollupStatus;

  constructor(
    code: string,
    title: string,
    conversionRate: number,
    sequence: number,
    startsAt: number,
    capacity: number,
    createdAt: number,
    segment: string,
    name: string,
    checksum: string,
    status: GlobalPreferenceRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.conversionRate = conversionRate;
    this.sequence = sequence;
    this.startsAt = startsAt;
    this.capacity = capacity;
    this.createdAt = createdAt;
    this.segment = segment;
    this.name = name;
    this.checksum = checksum;
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

  canMoveTo(next: GlobalPreferenceRollupStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
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

  moveTo(next: GlobalPreferenceRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global preference rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveTotal(): number {
    return Math.round((this.startsAt - this.createdAt) * 100) / 100;
  }

  copy(): GlobalPreferenceRollup {
    return new GlobalPreferenceRollup(
      this.code,
      this.title,
      this.conversionRate,
      this.sequence,
      this.startsAt,
      this.capacity,
      this.createdAt,
      this.segment,
      this.name,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a global preference rollup in status new. */
export function newGlobalPreferenceRollup(code: string, title: string): GlobalPreferenceRollup {
  return new GlobalPreferenceRollup(code, title, 0, 0, 0, 0, 0, "", "", "", "new");
}
