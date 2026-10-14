/**
 * The redemption rule records of loyaltyhub's redemption work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a redemption rule is in its life cycle. */
export type RedemptionRuleStatus = "new" | "queued" | "running" | "done" | "failed";

/** One redemption rule, with what the planners need to act on it. */
export class RedemptionRule {
  code: string;
  name: string;
  country: string;
  notes: string;
  frequencyCap: number;
  channel: string;
  expiresAt: number;
  status: RedemptionRuleStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    notes: string,
    frequencyCap: number,
    channel: string,
    expiresAt: number,
    status: RedemptionRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.notes = notes;
    this.frequencyCap = frequencyCap;
    this.channel = channel;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: RedemptionRuleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RedemptionRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netLoad(): number {
    return Math.round((this.frequencyCap - this.expiresAt) * 100) / 100;
  }

  copy(): RedemptionRule {
    return new RedemptionRule(
      this.code,
      this.name,
      this.country,
      this.notes,
      this.frequencyCap,
      this.channel,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a redemption rule in status new. */
export function newRedemptionRule(code: string, name: string): RedemptionRule {
  return new RedemptionRule(code, name, "", "", 0, "", 0, "new");
}
