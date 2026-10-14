/**
 * The lenient queue entry records of social's queue work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient queue entry is in its life cycle. */
export type LenientQueueEntryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A lenient queue entry as the queue team keeps it. */
export class LenientQueueEntry {
  code: string;
  name: string;
  quantity: number;
  segment: string;
  active: boolean;
  windowDays: number;
  batchSize: number;
  label: string;
  notes: string;
  ceiling: number;
  status: LenientQueueEntryStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    segment: string,
    active: boolean,
    windowDays: number,
    batchSize: number,
    label: string,
    notes: string,
    ceiling: number,
    status: LenientQueueEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.segment = segment;
    this.active = active;
    this.windowDays = windowDays;
    this.batchSize = batchSize;
    this.label = label;
    this.notes = notes;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientQueueEntryStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientQueueEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient queue entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient queue entry"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round(this.ceiling * this.quantity * 100) / 100;
  }

  copy(): LenientQueueEntry {
    return new LenientQueueEntry(
      this.code,
      this.name,
      this.quantity,
      this.segment,
      this.active,
      this.windowDays,
      this.batchSize,
      this.label,
      this.notes,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a lenient queue entry in status proposed. */
export function newLenientQueueEntry(code: string, name: string): LenientQueueEntry {
  return new LenientQueueEntry(code, name, 0, "", false, 0, 0, "", "", 0, "proposed");
}
