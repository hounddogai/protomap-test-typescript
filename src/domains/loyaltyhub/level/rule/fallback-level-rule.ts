/**
 * The fallback level rule records of loyaltyhub's level work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback level rule is in its life cycle. */
export type FallbackLevelRuleStatus = "requested" | "granted" | "revoked" | "expired";

/** A fallback level rule as the level team keeps it. */
export class FallbackLevelRule {
  code: string;
  label: string;
  locale: string;
  approved: boolean;
  bid: number;
  status: FallbackLevelRuleStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    approved: boolean,
    bid: number,
    status: FallbackLevelRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.approved = approved;
    this.bid = bid;
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

  canMoveTo(next: FallbackLevelRuleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackLevelRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback level rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.bid;
  }

  copy(): FallbackLevelRule {
    return new FallbackLevelRule(this.code, this.label, this.locale, this.approved, this.bid, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback level rule in status requested. */
export function newFallbackLevelRule(code: string, label: string): FallbackLevelRule {
  return new FallbackLevelRule(code, label, "", false, 0, "requested");
}
