import * as text from "../../../../kit/text.js";

/** Where a opt out baseline is in its life cycle. */
export type OptOutBaselineStatus = "requested" | "granted" | "revoked" | "expired";

/** A opt out baseline. Its code is unique within a tenant. */
export class OptOutBaseline {
  code: string;
  name: string;
  country: string;
  amount: number;
  threshold: number;
  status: OptOutBaselineStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    amount: number,
    threshold: number,
    status: OptOutBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.amount = amount;
    this.threshold = threshold;
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

  canMoveTo(next: OptOutBaselineStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
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

  moveTo(next: OptOutBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"opt out baseline"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.threshold * this.amount * 100) / 100;
  }

  copy(): OptOutBaseline {
    return new OptOutBaseline(this.code, this.name, this.country, this.amount, this.threshold, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a opt out baseline in status requested. */
export function newOptOutBaseline(code: string, name: string): OptOutBaseline {
  return new OptOutBaseline(code, name, "", 0, 0, "requested");
}
