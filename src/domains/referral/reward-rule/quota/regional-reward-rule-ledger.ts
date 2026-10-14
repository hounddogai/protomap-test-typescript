import * as text from "../../../../kit/text.js";

/** Where a regional reward rule ledger is in its life cycle. */
export type RegionalRewardRuleLedgerStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One regional reward rule ledger, with what the planners need to act on it. */
export class RegionalRewardRuleLedger {
  code: string;
  label: string;
  cohort: string;
  pinned: boolean;
  ownerId: string;
  ratio: number;
  status: RegionalRewardRuleLedgerStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    pinned: boolean,
    ownerId: string,
    ratio: number,
    status: RegionalRewardRuleLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.pinned = pinned;
    this.ownerId = ownerId;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalRewardRuleLedgerStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalRewardRuleLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional reward rule ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): RegionalRewardRuleLedger {
    return new RegionalRewardRuleLedger(
      this.code,
      this.label,
      this.cohort,
      this.pinned,
      this.ownerId,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional reward rule ledger in status planned. */
export function newRegionalRewardRuleLedger(code: string, label: string): RegionalRewardRuleLedger {
  return new RegionalRewardRuleLedger(code, label, "", false, "", 0, "planned");
}
