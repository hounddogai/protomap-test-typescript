/**
 * The global complaint slot records of deliverability's complaint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global complaint slot is in its life cycle. */
export type GlobalComplaintSlotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global complaint slot. Its code is unique within a tenant. */
export class GlobalComplaintSlot {
  code: string;
  name: string;
  timezone: string;
  budget: number;
  capacity: number;
  status: GlobalComplaintSlotStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    budget: number,
    capacity: number,
    status: GlobalComplaintSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.budget = budget;
    this.capacity = capacity;
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

  canMoveTo(next: GlobalComplaintSlotStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalComplaintSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global complaint slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedVolume(): number {
    return Math.round((this.capacity - this.budget) * 100) / 100;
  }

  copy(): GlobalComplaintSlot {
    return new GlobalComplaintSlot(this.code, this.name, this.timezone, this.budget, this.capacity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global complaint slot in status planned. */
export function newGlobalComplaintSlot(code: string, name: string): GlobalComplaintSlot {
  return new GlobalComplaintSlot(code, name, "", 0, 0, "planned");
}
