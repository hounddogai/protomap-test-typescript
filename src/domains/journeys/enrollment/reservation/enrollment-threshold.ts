import * as text from "../../../../kit/text.js";

/** Where a enrollment threshold is in its life cycle. */
export type EnrollmentThresholdStatus = "requested" | "granted" | "revoked" | "expired";

/** A enrollment threshold as the enrollment team keeps it. */
export class EnrollmentThreshold {
  code: string;
  name: string;
  capacity: number;
  country: string;
  quantity: number;
  status: EnrollmentThresholdStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    country: string,
    quantity: number,
    status: EnrollmentThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.country = country;
    this.quantity = quantity;
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

  canMoveTo(next: EnrollmentThresholdStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EnrollmentThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveVolume(): number {
    return Math.round(this.quantity * this.capacity * 100) / 100;
  }

  copy(): EnrollmentThreshold {
    return new EnrollmentThreshold(this.code, this.name, this.capacity, this.country, this.quantity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a enrollment threshold in status requested. */
export function newEnrollmentThreshold(code: string, name: string): EnrollmentThreshold {
  return new EnrollmentThreshold(code, name, 0, "", 0, "requested");
}
