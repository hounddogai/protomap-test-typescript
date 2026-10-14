import * as text from "../../../../kit/text.js";

/** Where a activation override is in its life cycle. */
export type ActivationOverrideStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a activation override and its current status. */
export class ActivationOverride {
  code: string;
  name: string;
  minimum: number;
  retries: number;
  phone: string;
  currency: string;
  checksum: string;
  status: ActivationOverrideStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    retries: number,
    phone: string,
    currency: string,
    checksum: string,
    status: ActivationOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.retries = retries;
    this.phone = phone;
    this.currency = currency;
    this.checksum = checksum;
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

  canMoveTo(next: ActivationOverrideStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ActivationOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round(this.minimum * this.retries * 100) / 100;
  }

  copy(): ActivationOverride {
    return new ActivationOverride(
      this.code,
      this.name,
      this.minimum,
      this.retries,
      this.phone,
      this.currency,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a activation override in status open. */
export function newActivationOverride(code: string, name: string): ActivationOverride {
  return new ActivationOverride(code, name, 0, 0, "", "", "", "open");
}
