import * as text from "../../../../kit/text.js";

/** Where a lenient deflection claim is in its life cycle. */
export type LenientDeflectionClaimStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One lenient deflection claim, with what the planners need to act on it. */
export class LenientDeflectionClaim {
  code: string;
  name: string;
  quantity: number;
  notes: string;
  phone: string;
  capacity: number;
  sequence: number;
  threshold: number;
  status: LenientDeflectionClaimStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    notes: string,
    phone: string,
    capacity: number,
    sequence: number,
    threshold: number,
    status: LenientDeflectionClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.notes = notes;
    this.phone = phone;
    this.capacity = capacity;
    this.sequence = sequence;
    this.threshold = threshold;
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

  canMoveTo(next: LenientDeflectionClaimStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LenientDeflectionClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient deflection claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedExposure(): number {
    return Math.round((this.sequence + this.threshold) * 100) / 100;
  }

  copy(): LenientDeflectionClaim {
    return new LenientDeflectionClaim(
      this.code,
      this.name,
      this.quantity,
      this.notes,
      this.phone,
      this.capacity,
      this.sequence,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient deflection claim in status proposed. */
export function newLenientDeflectionClaim(code: string, name: string): LenientDeflectionClaim {
  return new LenientDeflectionClaim(code, name, 0, "", "", 0, 0, 0, "proposed");
}
