/**
 * The rolling reward rule ledger records of referral's reward rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling reward rule ledger is in its life cycle. */
export type RollingRewardRuleLedgerStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a rolling reward rule ledger and its current status. */
export class RollingRewardRuleLedger {
  code: string;
  label: string;
  active: boolean;
  source: string;
  openRate: number;
  capacity: number;
  updatedAt: number;
  journeyId: string;
  visible: boolean;
  status: RollingRewardRuleLedgerStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    source: string,
    openRate: number,
    capacity: number,
    updatedAt: number,
    journeyId: string,
    visible: boolean,
    status: RollingRewardRuleLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.source = source;
    this.openRate = openRate;
    this.capacity = capacity;
    this.updatedAt = updatedAt;
    this.journeyId = journeyId;
    this.visible = visible;
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

  canMoveTo(next: RollingRewardRuleLedgerStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RollingRewardRuleLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling reward rule ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round((this.capacity - this.updatedAt) * 100) / 100;
  }

  copy(): RollingRewardRuleLedger {
    return new RollingRewardRuleLedger(
      this.code,
      this.label,
      this.active,
      this.source,
      this.openRate,
      this.capacity,
      this.updatedAt,
      this.journeyId,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a rolling reward rule ledger in status open. */
export function newRollingRewardRuleLedger(code: string, label: string): RollingRewardRuleLedger {
  return new RollingRewardRuleLedger(code, label, false, "", 0, 0, 0, "", false, "open");
}
