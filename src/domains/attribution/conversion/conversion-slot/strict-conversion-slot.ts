/**
 * The strict conversion slot records of attribution's conversion work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict conversion slot is in its life cycle. */
export type StrictConversionSlotStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict conversion slot. Its code is unique within a tenant. */
export class StrictConversionSlot {
  code: string;
  title: string;
  version: number;
  campaignRef: string;
  threshold: number;
  status: StrictConversionSlotStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    campaignRef: string,
    threshold: number,
    status: StrictConversionSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.campaignRef = campaignRef;
    this.threshold = threshold;
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

  canMoveTo(next: StrictConversionSlotStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictConversionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict conversion slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedLoad(): number {
    return Math.round((this.threshold + this.version) * 100) / 100;
  }

  copy(): StrictConversionSlot {
    return new StrictConversionSlot(this.code, this.title, this.version, this.campaignRef, this.threshold, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict conversion slot in status requested. */
export function newStrictConversionSlot(code: string, title: string): StrictConversionSlot {
  return new StrictConversionSlot(code, title, 0, "", 0, "requested");
}
