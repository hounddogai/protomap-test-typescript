import * as text from "../../../../kit/text.js";

/** Where a capped step slot is in its life cycle. */
export type CappedStepSlotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a capped step slot and its current status. */
export class CappedStepSlot {
  code: string;
  title: string;
  quantity: number;
  active: boolean;
  budget: number;
  ratio: number;
  timezone: string;
  status: CappedStepSlotStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    active: boolean,
    budget: number,
    ratio: number,
    timezone: string,
    status: CappedStepSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.active = active;
    this.budget = budget;
    this.ratio = ratio;
    this.timezone = timezone;
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

  canMoveTo(next: CappedStepSlotStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedStepSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped step slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedValue(): number {
    return Math.round((this.quantity - this.budget) * 100) / 100;
  }

  copy(): CappedStepSlot {
    return new CappedStepSlot(
      this.code,
      this.title,
      this.quantity,
      this.active,
      this.budget,
      this.ratio,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped step slot in status idle. */
export function newCappedStepSlot(code: string, title: string): CappedStepSlot {
  return new CappedStepSlot(code, title, 0, false, 0, 0, "", "idle");
}
