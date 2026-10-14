/**
 * The capped proof agreement records of consentcenter's proof work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped proof agreement is in its life cycle. */
export type CappedProofAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A capped proof agreement as the proof team keeps it. */
export class CappedProofAgreement {
  code: string;
  name: string;
  endsAt: number;
  budget: number;
  source: string;
  description: string;
  status: CappedProofAgreementStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    budget: number,
    source: string,
    description: string,
    status: CappedProofAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.budget = budget;
    this.source = source;
    this.description = description;
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

  canMoveTo(next: CappedProofAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "draining" || next === "stopped";
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

  moveTo(next: CappedProofAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped proof agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round((this.endsAt - this.budget) * 100) / 100;
  }

  copy(): CappedProofAgreement {
    return new CappedProofAgreement(
      this.code,
      this.name,
      this.endsAt,
      this.budget,
      this.source,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a capped proof agreement in status idle. */
export function newCappedProofAgreement(code: string, name: string): CappedProofAgreement {
  return new CappedProofAgreement(code, name, 0, 0, "", "", "idle");
}
