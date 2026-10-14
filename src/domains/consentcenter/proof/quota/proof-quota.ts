/**
 * The proof quota records of consentcenter's proof work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a proof quota is in its life cycle. */
export type ProofQuotaStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a proof quota and its current status. */
export class ProofQuota {
  code: string;
  name: string;
  unit: string;
  region: string;
  utmSource: string;
  externalRef: string;
  amount: number;
  status: ProofQuotaStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    region: string,
    utmSource: string,
    externalRef: string,
    amount: number,
    status: ProofQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.region = region;
    this.utmSource = utmSource;
    this.externalRef = externalRef;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ProofQuotaStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ProofQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): ProofQuota {
    return new ProofQuota(
      this.code,
      this.name,
      this.unit,
      this.region,
      this.utmSource,
      this.externalRef,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a proof quota in status open. */
export function newProofQuota(code: string, name: string): ProofQuota {
  return new ProofQuota(code, name, "", "", "", "", 0, "open");
}
