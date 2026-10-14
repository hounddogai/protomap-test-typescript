import * as text from "../../../../kit/text.js";

/** Where a escalation override is in its life cycle. */
export type EscalationOverrideStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a escalation override and its current status. */
export class EscalationOverride {
  code: string;
  name: string;
  cohort: string;
  amount: number;
  minimum: number;
  reviewer: string;
  status: EscalationOverrideStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    amount: number,
    minimum: number,
    reviewer: string,
    status: EscalationOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.amount = amount;
    this.minimum = minimum;
    this.reviewer = reviewer;
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

  canMoveTo(next: EscalationOverrideStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: EscalationOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round((this.amount - this.minimum) * 100) / 100;
  }

  copy(): EscalationOverride {
    return new EscalationOverride(
      this.code,
      this.name,
      this.cohort,
      this.amount,
      this.minimum,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a escalation override in status requested. */
export function newEscalationOverride(code: string, name: string): EscalationOverride {
  return new EscalationOverride(code, name, "", 0, 0, "", "requested");
}
