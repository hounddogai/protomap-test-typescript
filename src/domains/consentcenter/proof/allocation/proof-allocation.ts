/**
 * The proof allocation records of consentcenter's proof work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a proof allocation is in its life cycle. */
export type ProofAllocationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One proof allocation, with what the planners need to act on it. */
export class ProofAllocation {
  code: string;
  label: string;
  capacity: number;
  variant: string;
  locale: string;
  status: ProofAllocationStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    variant: string,
    locale: string,
    status: ProofAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.variant = variant;
    this.locale = locale;
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

  canMoveTo(next: ProofAllocationStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
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

  moveTo(next: ProofAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.capacity;
  }

  copy(): ProofAllocation {
    return new ProofAllocation(this.code, this.label, this.capacity, this.variant, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a proof allocation in status proposed. */
export function newProofAllocation(code: string, label: string): ProofAllocation {
  return new ProofAllocation(code, label, 0, "", "", "proposed");
}
