import * as text from "../../../../kit/text.js";

/** Where a tiered reward rule entry is in its life cycle. */
export type TieredRewardRuleEntryStatus = "created" | "validated" | "published" | "retired";

/** The record of a tiered reward rule entry and its current status. */
export class TieredRewardRuleEntry {
  code: string;
  label: string;
  ratio: number;
  approved: boolean;
  variant: string;
  clicks: number;
  reviewer: string;
  sendAt: number;
  cost: number;
  ceiling: number;
  status: TieredRewardRuleEntryStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    approved: boolean,
    variant: string,
    clicks: number,
    reviewer: string,
    sendAt: number,
    cost: number,
    ceiling: number,
    status: TieredRewardRuleEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.approved = approved;
    this.variant = variant;
    this.clicks = clicks;
    this.reviewer = reviewer;
    this.sendAt = sendAt;
    this.cost = cost;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredRewardRuleEntryStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TieredRewardRuleEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reward rule entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.clicks - this.sendAt) * 100) / 100;
  }

  copy(): TieredRewardRuleEntry {
    return new TieredRewardRuleEntry(
      this.code,
      this.label,
      this.ratio,
      this.approved,
      this.variant,
      this.clicks,
      this.reviewer,
      this.sendAt,
      this.cost,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered reward rule entry in status created. */
export function newTieredRewardRuleEntry(code: string, label: string): TieredRewardRuleEntry {
  return new TieredRewardRuleEntry(code, label, 0, false, "", 0, "", 0, 0, 0, "created");
}
