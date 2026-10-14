/**
 * The default macro baseline records of support's macro work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default macro baseline is in its life cycle. */
export type DefaultMacroBaselineStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A default macro baseline. Its code is unique within a tenant. */
export class DefaultMacroBaseline {
  code: string;
  name: string;
  amount: number;
  endsAt: number;
  ratio: number;
  locale: string;
  capacity: number;
  country: string;
  ceiling: number;
  maximum: number;
  status: DefaultMacroBaselineStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    endsAt: number,
    ratio: number,
    locale: string,
    capacity: number,
    country: string,
    ceiling: number,
    maximum: number,
    status: DefaultMacroBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.endsAt = endsAt;
    this.ratio = ratio;
    this.locale = locale;
    this.capacity = capacity;
    this.country = country;
    this.ceiling = ceiling;
    this.maximum = maximum;
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

  canMoveTo(next: DefaultMacroBaselineStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
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

  moveTo(next: DefaultMacroBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default macro baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"default macro baseline"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.ceiling - this.amount) * 100) / 100;
  }

  copy(): DefaultMacroBaseline {
    return new DefaultMacroBaseline(
      this.code,
      this.name,
      this.amount,
      this.endsAt,
      this.ratio,
      this.locale,
      this.capacity,
      this.country,
      this.ceiling,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default macro baseline in status proposed. */
export function newDefaultMacroBaseline(code: string, name: string): DefaultMacroBaseline {
  return new DefaultMacroBaseline(code, name, 0, 0, 0, "", 0, "", 0, 0, "proposed");
}
