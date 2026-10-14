import * as text from "../../../../kit/text.js";

/** Where a double opt in cycle is in its life cycle. */
export type DoubleOptInCycleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A double opt in cycle. Its code is unique within a tenant. */
export class DoubleOptInCycle {
  code: string;
  label: string;
  startsAt: number;
  externalRef: string;
  openRate: number;
  createdAt: number;
  amount: number;
  status: DoubleOptInCycleStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    externalRef: string,
    openRate: number,
    createdAt: number,
    amount: number,
    status: DoubleOptInCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.externalRef = externalRef;
    this.openRate = openRate;
    this.createdAt = createdAt;
    this.amount = amount;
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

  canMoveTo(next: DoubleOptInCycleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DoubleOptInCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netVolume(): number {
    return Math.round((this.openRate - this.amount) * 100) / 100;
  }

  copy(): DoubleOptInCycle {
    return new DoubleOptInCycle(
      this.code,
      this.label,
      this.startsAt,
      this.externalRef,
      this.openRate,
      this.createdAt,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a double opt in cycle in status proposed. */
export function newDoubleOptInCycle(code: string, label: string): DoubleOptInCycle {
  return new DoubleOptInCycle(code, label, 0, "", 0, 0, 0, "proposed");
}
