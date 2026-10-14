/**
 * The credit group records of attribution's credit work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a credit group is in its life cycle. */
export type CreditGroupStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a credit group and its current status. */
export class CreditGroup {
  code: string;
  name: string;
  locale: string;
  timezone: string;
  budget: number;
  status: CreditGroupStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    timezone: string,
    budget: number,
    status: CreditGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.timezone = timezone;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreditGroupStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreditGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): CreditGroup {
    return new CreditGroup(this.code, this.name, this.locale, this.timezone, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a credit group in status new. */
export function newCreditGroup(code: string, name: string): CreditGroup {
  return new CreditGroup(code, name, "", "", 0, "new");
}
