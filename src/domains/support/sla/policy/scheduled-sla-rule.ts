import * as text from "../../../../kit/text.js";

/** Where a scheduled sla rule is in its life cycle. */
export type ScheduledSlaRuleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a scheduled sla rule and its current status. */
export class ScheduledSlaRule {
  code: string;
  title: string;
  bid: number;
  amount: number;
  approved: boolean;
  retries: number;
  currency: string;
  tags: string[];
  status: ScheduledSlaRuleStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    amount: number,
    approved: boolean,
    retries: number,
    currency: string,
    tags: string[],
    status: ScheduledSlaRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.amount = amount;
    this.approved = approved;
    this.retries = retries;
    this.currency = currency;
    this.tags = tags;
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

  canMoveTo(next: ScheduledSlaRuleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ScheduledSlaRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled sla rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedExposure(): number {
    return Math.round(this.amount * this.bid * 100) / 100;
  }

  copy(): ScheduledSlaRule {
    return new ScheduledSlaRule(
      this.code,
      this.title,
      this.bid,
      this.amount,
      this.approved,
      this.retries,
      this.currency,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled sla rule in status draft. */
export function newScheduledSlaRule(code: string, title: string): ScheduledSlaRule {
  return new ScheduledSlaRule(code, title, 0, 0, false, 0, "", [], "draft");
}
