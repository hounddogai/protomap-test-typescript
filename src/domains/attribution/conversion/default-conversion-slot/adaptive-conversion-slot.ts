/**
 * The adaptive conversion slot records of attribution's conversion work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive conversion slot is in its life cycle. */
export type AdaptiveConversionSlotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A adaptive conversion slot as the conversion team keeps it. */
export class AdaptiveConversionSlot {
  code: string;
  name: string;
  locale: string;
  summary: string;
  variant: string;
  openRate: number;
  status: AdaptiveConversionSlotStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    summary: string,
    variant: string,
    openRate: number,
    status: AdaptiveConversionSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.summary = summary;
    this.variant = variant;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveConversionSlotStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveConversionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive conversion slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.openRate;
  }

  copy(): AdaptiveConversionSlot {
    return new AdaptiveConversionSlot(
      this.code,
      this.name,
      this.locale,
      this.summary,
      this.variant,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a adaptive conversion slot in status draft. */
export function newAdaptiveConversionSlot(code: string, name: string): AdaptiveConversionSlot {
  return new AdaptiveConversionSlot(code, name, "", "", "", 0, "draft");
}
