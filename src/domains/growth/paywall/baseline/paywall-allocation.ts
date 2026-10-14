import * as text from "../../../../kit/text.js";

/** Where a paywall allocation is in its life cycle. */
export type PaywallAllocationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a paywall allocation and its current status. */
export class PaywallAllocation {
  code: string;
  name: string;
  unit: string;
  graceDays: number;
  floorValue: number;
  sequence: number;
  title: string;
  minimum: number;
  locale: string;
  status: PaywallAllocationStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    graceDays: number,
    floorValue: number,
    sequence: number,
    title: string,
    minimum: number,
    locale: string,
    status: PaywallAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.graceDays = graceDays;
    this.floorValue = floorValue;
    this.sequence = sequence;
    this.title = title;
    this.minimum = minimum;
    this.locale = locale;
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

  canMoveTo(next: PaywallAllocationStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PaywallAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedExposure(): number {
    return Math.round((this.graceDays - this.minimum) * 100) / 100;
  }

  copy(): PaywallAllocation {
    return new PaywallAllocation(
      this.code,
      this.name,
      this.unit,
      this.graceDays,
      this.floorValue,
      this.sequence,
      this.title,
      this.minimum,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a paywall allocation in status idle. */
export function newPaywallAllocation(code: string, name: string): PaywallAllocation {
  return new PaywallAllocation(code, name, "", 0, 0, 0, "", 0, "", "idle");
}
