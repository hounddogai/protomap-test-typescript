import * as text from "../../../../kit/text.js";

/** Where a reward rule ledger is in its life cycle. */
export type RewardRuleLedgerStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One reward rule ledger, with what the planners need to act on it. */
export class RewardRuleLedger {
  code: string;
  name: string;
  discount: number;
  cohort: string;
  region: string;
  status: RewardRuleLedgerStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    cohort: string,
    region: string,
    status: RewardRuleLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.cohort = cohort;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardRuleLedgerStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardRuleLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"reward rule ledger"} ${this.code}`;
  }

  measuredValue(): number {
    return this.discount;
  }

  copy(): RewardRuleLedger {
    return new RewardRuleLedger(this.code, this.name, this.discount, this.cohort, this.region, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a reward rule ledger in status draft. */
export function newRewardRuleLedger(code: string, name: string): RewardRuleLedger {
  return new RewardRuleLedger(code, name, 0, "", "", "draft");
}
