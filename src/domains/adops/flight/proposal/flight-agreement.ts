import * as text from "../../../../kit/text.js";

/** Where a flight agreement is in its life cycle. */
export type FlightAgreementStatus = "created" | "validated" | "published" | "retired";

/** A flight agreement. Its code is unique within a tenant. */
export class FlightAgreement {
  code: string;
  label: string;
  weight: number;
  version: number;
  retries: number;
  budget: number;
  createdAt: number;
  status: FlightAgreementStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    version: number,
    retries: number,
    budget: number,
    createdAt: number,
    status: FlightAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.version = version;
    this.retries = retries;
    this.budget = budget;
    this.createdAt = createdAt;
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

  canMoveTo(next: FlightAgreementStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round((this.weight + this.budget) * 100) / 100;
  }

  copy(): FlightAgreement {
    return new FlightAgreement(
      this.code,
      this.label,
      this.weight,
      this.version,
      this.retries,
      this.budget,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a flight agreement in status created. */
export function newFlightAgreement(code: string, label: string): FlightAgreement {
  return new FlightAgreement(code, label, 0, 0, 0, 0, 0, "created");
}
