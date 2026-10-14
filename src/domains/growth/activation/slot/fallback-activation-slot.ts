/**
 * The fallback activation slot records of growth's activation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback activation slot is in its life cycle. */
export type FallbackActivationSlotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A fallback activation slot as the activation team keeps it. */
export class FallbackActivationSlot {
  code: string;
  label: string;
  ratio: number;
  rate: number;
  createdAt: number;
  status: FallbackActivationSlotStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    rate: number,
    createdAt: number,
    status: FallbackActivationSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.rate = rate;
    this.createdAt = createdAt;
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

  canMoveTo(next: FallbackActivationSlotStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
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

  moveTo(next: FallbackActivationSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback activation slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"fallback activation slot"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.rate + this.ratio) * 100) / 100;
  }

  copy(): FallbackActivationSlot {
    return new FallbackActivationSlot(this.code, this.label, this.ratio, this.rate, this.createdAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback activation slot in status planned. */
export function newFallbackActivationSlot(code: string, label: string): FallbackActivationSlot {
  return new FallbackActivationSlot(code, label, 0, 0, 0, "planned");
}
