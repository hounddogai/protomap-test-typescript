/**
 * The legacy invite rule records of referral's invite work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy invite rule is in its life cycle. */
export type LegacyInviteRuleStatus = "new" | "queued" | "running" | "done" | "failed";

/** One legacy invite rule, with what the planners need to act on it. */
export class LegacyInviteRule {
  code: string;
  name: string;
  timezone: string;
  amount: number;
  phone: string;
  tags: string[];
  unit: string;
  ceiling: number;
  graceDays: number;
  locale: string;
  status: LegacyInviteRuleStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    amount: number,
    phone: string,
    tags: string[],
    unit: string,
    ceiling: number,
    graceDays: number,
    locale: string,
    status: LegacyInviteRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.amount = amount;
    this.phone = phone;
    this.tags = tags;
    this.unit = unit;
    this.ceiling = ceiling;
    this.graceDays = graceDays;
    this.locale = locale;
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

  canMoveTo(next: LegacyInviteRuleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyInviteRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy invite rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"legacy invite rule"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedVolume(): number {
    return Math.round((this.amount - this.ceiling) * 100) / 100;
  }

  copy(): LegacyInviteRule {
    return new LegacyInviteRule(
      this.code,
      this.name,
      this.timezone,
      this.amount,
      this.phone,
      this.tags,
      this.unit,
      this.ceiling,
      this.graceDays,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a legacy invite rule in status new. */
export function newLegacyInviteRule(code: string, name: string): LegacyInviteRule {
  return new LegacyInviteRule(code, name, "", 0, "", [], "", 0, 0, "", "new");
}
