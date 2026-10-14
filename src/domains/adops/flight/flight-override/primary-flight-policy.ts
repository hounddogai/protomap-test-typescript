import * as text from "../../../../kit/text.js";

/** Where a primary flight policy is in its life cycle. */
export type PrimaryFlightPolicyStatus = "created" | "validated" | "published" | "retired";

/** A primary flight policy as the flight team keeps it. */
export class PrimaryFlightPolicy {
  code: string;
  label: string;
  rate: number;
  channel: string;
  amount: number;
  status: PrimaryFlightPolicyStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    channel: string,
    amount: number,
    status: PrimaryFlightPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.channel = channel;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryFlightPolicyStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PrimaryFlightPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary flight policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round((this.rate + this.amount) * 100) / 100;
  }

  copy(): PrimaryFlightPolicy {
    return new PrimaryFlightPolicy(this.code, this.label, this.rate, this.channel, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a primary flight policy in status created. */
export function newPrimaryFlightPolicy(code: string, label: string): PrimaryFlightPolicy {
  return new PrimaryFlightPolicy(code, label, 0, "", 0, "created");
}
