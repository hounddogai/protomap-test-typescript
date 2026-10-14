import * as text from "../../../../kit/text.js";

/** Where a fallback retention slot is in its life cycle. */
export type FallbackRetentionSlotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A fallback retention slot. Its code is unique within a tenant. */
export class FallbackRetentionSlot {
  code: string;
  name: string;
  quantity: number;
  cohort: string;
  unit: string;
  status: FallbackRetentionSlotStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    cohort: string,
    unit: string,
    status: FallbackRetentionSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.cohort = cohort;
    this.unit = unit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackRetentionSlotStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FallbackRetentionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback retention slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): FallbackRetentionSlot {
    return new FallbackRetentionSlot(this.code, this.name, this.quantity, this.cohort, this.unit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a fallback retention slot in status idle. */
export function newFallbackRetentionSlot(code: string, name: string): FallbackRetentionSlot {
  return new FallbackRetentionSlot(code, name, 0, "", "", "idle");
}
