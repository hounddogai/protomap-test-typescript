/**
 * The step quota records of journeys's step work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a step quota is in its life cycle. */
export type StepQuotaStatus = "created" | "validated" | "published" | "retired";

/** A step quota as the step team keeps it. */
export class StepQuota {
  code: string;
  name: string;
  timezone: string;
  currency: string;
  attributes: Map<string, string>;
  discount: number;
  status: StepQuotaStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    currency: string,
    attributes: Map<string, string>,
    discount: number,
    status: StepQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.currency = currency;
    this.attributes = attributes;
    this.discount = discount;
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

  canMoveTo(next: StepQuotaStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
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

  moveTo(next: StepQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.discount;
  }

  copy(): StepQuota {
    return new StepQuota(
      this.code,
      this.name,
      this.timezone,
      this.currency,
      this.attributes,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a step quota in status created. */
export function newStepQuota(code: string, name: string): StepQuota {
  return new StepQuota(code, name, "", "", new Map<string, string>(), 0, "created");
}
