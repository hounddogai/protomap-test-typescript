/**
 * The lenient flight slot records of adops's flight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient flight slot is in its life cycle. */
export type LenientFlightSlotStatus = "requested" | "granted" | "revoked" | "expired";

/** A lenient flight slot. Its code is unique within a tenant. */
export class LenientFlightSlot {
  code: string;
  title: string;
  durationMinutes: number;
  conversionRate: number;
  retries: number;
  status: LenientFlightSlotStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    conversionRate: number,
    retries: number,
    status: LenientFlightSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.conversionRate = conversionRate;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientFlightSlotStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientFlightSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient flight slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient flight slot"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.durationMinutes + this.conversionRate) * 100) / 100;
  }

  copy(): LenientFlightSlot {
    return new LenientFlightSlot(
      this.code,
      this.title,
      this.durationMinutes,
      this.conversionRate,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient flight slot in status requested. */
export function newLenientFlightSlot(code: string, title: string): LenientFlightSlot {
  return new LenientFlightSlot(code, title, 0, 0, 0, "requested");
}
