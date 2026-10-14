import * as text from "../../../../kit/text.js";

/** Where a legacy reward rule ledger is in its life cycle. */
export type LegacyRewardRuleLedgerStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A legacy reward rule ledger. Its code is unique within a tenant. */
export class LegacyRewardRuleLedger {
  code: string;
  title: string;
  approved: boolean;
  visible: boolean;
  threshold: number;
  status: LegacyRewardRuleLedgerStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    visible: boolean,
    threshold: number,
    status: LegacyRewardRuleLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.visible = visible;
    this.threshold = threshold;
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

  canMoveTo(next: LegacyRewardRuleLedgerStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LegacyRewardRuleLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy reward rule ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.threshold;
  }

  copy(): LegacyRewardRuleLedger {
    return new LegacyRewardRuleLedger(this.code, this.title, this.approved, this.visible, this.threshold, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy reward rule ledger in status draft. */
export function newLegacyRewardRuleLedger(code: string, title: string): LegacyRewardRuleLedger {
  return new LegacyRewardRuleLedger(code, title, false, false, 0, "draft");
}
