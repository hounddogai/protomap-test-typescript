import * as text from "../../../../kit/text.js";

/** Where a lenient opt out cycle is in its life cycle. */
export type LenientOptOutCycleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A lenient opt out cycle as the opt out team keeps it. */
export class LenientOptOutCycle {
  code: string;
  name: string;
  pinned: boolean;
  country: string;
  expiresAt: number;
  ratio: number;
  currency: string;
  status: LenientOptOutCycleStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    country: string,
    expiresAt: number,
    ratio: number,
    currency: string,
    status: LenientOptOutCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.country = country;
    this.expiresAt = expiresAt;
    this.ratio = ratio;
    this.currency = currency;
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

  canMoveTo(next: LenientOptOutCycleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        return next === "draining";
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

  moveTo(next: LenientOptOutCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient opt out cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round((this.ratio - this.expiresAt) * 100) / 100;
  }

  copy(): LenientOptOutCycle {
    return new LenientOptOutCycle(
      this.code,
      this.name,
      this.pinned,
      this.country,
      this.expiresAt,
      this.ratio,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a lenient opt out cycle in status idle. */
export function newLenientOptOutCycle(code: string, name: string): LenientOptOutCycle {
  return new LenientOptOutCycle(code, name, false, "", 0, 0, "", "idle");
}
