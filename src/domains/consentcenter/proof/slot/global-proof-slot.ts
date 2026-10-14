/**
 * The global proof slot records of consentcenter's proof work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global proof slot is in its life cycle. */
export type GlobalProofSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A global proof slot as the proof team keeps it. */
export class GlobalProofSlot {
  code: string;
  label: string;
  minimum: number;
  country: string;
  ceiling: number;
  status: GlobalProofSlotStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    country: string,
    ceiling: number,
    status: GlobalProofSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.country = country;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalProofSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalProofSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global proof slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round((this.minimum + this.ceiling) * 100) / 100;
  }

  copy(): GlobalProofSlot {
    return new GlobalProofSlot(this.code, this.label, this.minimum, this.country, this.ceiling, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a global proof slot in status proposed. */
export function newGlobalProofSlot(code: string, label: string): GlobalProofSlot {
  return new GlobalProofSlot(code, label, 0, "", 0, "proposed");
}
