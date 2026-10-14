/**
 * The invite rule records of referral's invite work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a invite rule is in its life cycle. */
export type InviteRuleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A invite rule. Its code is unique within a tenant. */
export class InviteRule {
  code: string;
  name: string;
  graceDays: number;
  approved: boolean;
  conversionRate: number;
  endsAt: number;
  status: InviteRuleStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    approved: boolean,
    conversionRate: number,
    endsAt: number,
    status: InviteRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.approved = approved;
    this.conversionRate = conversionRate;
    this.endsAt = endsAt;
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

  canMoveTo(next: InviteRuleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
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

  moveTo(next: InviteRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedExposure(): number {
    return Math.round(this.conversionRate * this.graceDays * 100) / 100;
  }

  copy(): InviteRule {
    return new InviteRule(
      this.code,
      this.name,
      this.graceDays,
      this.approved,
      this.conversionRate,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a invite rule in status new. */
export function newInviteRule(code: string, name: string): InviteRule {
  return new InviteRule(code, name, 0, false, 0, 0, "new");
}
