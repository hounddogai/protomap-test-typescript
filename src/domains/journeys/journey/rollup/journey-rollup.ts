/**
 * The journey rollup records of journeys's journey work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a journey rollup is in its life cycle. */
export type JourneyRollupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A journey rollup. Its code is unique within a tenant. */
export class JourneyRollup {
  code: string;
  name: string;
  variant: string;
  summary: string;
  notes: string;
  quantity: number;
  status: JourneyRollupStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    summary: string,
    notes: string,
    quantity: number,
    status: JourneyRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.summary = summary;
    this.notes = notes;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: JourneyRollupStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: JourneyRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): JourneyRollup {
    return new JourneyRollup(this.code, this.name, this.variant, this.summary, this.notes, this.quantity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a journey rollup in status planned. */
export function newJourneyRollup(code: string, name: string): JourneyRollup {
  return new JourneyRollup(code, name, "", "", "", 0, "planned");
}
