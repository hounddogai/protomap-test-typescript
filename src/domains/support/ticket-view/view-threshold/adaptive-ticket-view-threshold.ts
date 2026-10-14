/**
 * The adaptive ticket view threshold records of support's ticket view work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive ticket view threshold is in its life cycle. */
export type AdaptiveTicketViewThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One adaptive ticket view threshold, with what the planners need to act on it. */
export class AdaptiveTicketViewThreshold {
  code: string;
  name: string;
  unit: string;
  budget: number;
  currency: string;
  timezone: string;
  status: AdaptiveTicketViewThresholdStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    budget: number,
    currency: string,
    timezone: string,
    status: AdaptiveTicketViewThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.budget = budget;
    this.currency = currency;
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

  canMoveTo(next: AdaptiveTicketViewThresholdStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: AdaptiveTicketViewThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive ticket view threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): AdaptiveTicketViewThreshold {
    return new AdaptiveTicketViewThreshold(
      this.code,
      this.name,
      this.unit,
      this.budget,
      this.currency,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a adaptive ticket view threshold in status idle. */
export function newAdaptiveTicketViewThreshold(code: string, name: string): AdaptiveTicketViewThreshold {
  return new AdaptiveTicketViewThreshold(code, name, "", 0, "", "", "idle");
}
