/**
 * The strict window profile records of attribution's window work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict window profile is in its life cycle. */
export type StrictWindowProfileStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict window profile. Its code is unique within a tenant. */
export class StrictWindowProfile {
  code: string;
  name: string;
  durationMinutes: number;
  rate: number;
  source: string;
  pinned: boolean;
  conversionRate: number;
  variant: string;
  status: StrictWindowProfileStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    rate: number,
    source: string,
    pinned: boolean,
    conversionRate: number,
    variant: string,
    status: StrictWindowProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.rate = rate;
    this.source = source;
    this.pinned = pinned;
    this.conversionRate = conversionRate;
    this.variant = variant;
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

  canMoveTo(next: StrictWindowProfileStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
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

  moveTo(next: StrictWindowProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict window profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedLoad(): number {
    return Math.round((this.durationMinutes - this.rate) * 100) / 100;
  }

  copy(): StrictWindowProfile {
    return new StrictWindowProfile(
      this.code,
      this.name,
      this.durationMinutes,
      this.rate,
      this.source,
      this.pinned,
      this.conversionRate,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a strict window profile in status idle. */
export function newStrictWindowProfile(code: string, name: string): StrictWindowProfile {
  return new StrictWindowProfile(code, name, 0, 0, "", false, 0, "", "idle");
}
