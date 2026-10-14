import * as text from "../../../../kit/text.js";

/** Where a proof group is in its life cycle. */
export type ProofGroupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A proof group as the proof team keeps it. */
export class ProofGroup {
  code: string;
  title: string;
  openRate: number;
  budget: number;
  floorValue: number;
  amount: number;
  timezone: string;
  conversionRate: number;
  externalRef: string;
  status: ProofGroupStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    budget: number,
    floorValue: number,
    amount: number,
    timezone: string,
    conversionRate: number,
    externalRef: string,
    status: ProofGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.budget = budget;
    this.floorValue = floorValue;
    this.amount = amount;
    this.timezone = timezone;
    this.conversionRate = conversionRate;
    this.externalRef = externalRef;
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

  canMoveTo(next: ProofGroupStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ProofGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedExposure(): number {
    return Math.round((this.conversionRate + this.budget) * 100) / 100;
  }

  copy(): ProofGroup {
    return new ProofGroup(
      this.code,
      this.title,
      this.openRate,
      this.budget,
      this.floorValue,
      this.amount,
      this.timezone,
      this.conversionRate,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a proof group in status proposed. */
export function newProofGroup(code: string, title: string): ProofGroup {
  return new ProofGroup(code, title, 0, 0, 0, 0, "", 0, "", "proposed");
}
