import * as text from "../../../../kit/text.js";

/** Where a bid rule audit is in its life cycle. */
export type BidRuleAuditStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A bid rule audit as the bid rule team keeps it. */
export class BidRuleAudit {
  code: string;
  title: string;
  conversionRate: number;
  expiresAt: number;
  region: string;
  approved: boolean;
  status: BidRuleAuditStatus;

  constructor(
    code: string,
    title: string,
    conversionRate: number,
    expiresAt: number,
    region: string,
    approved: boolean,
    status: BidRuleAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.conversionRate = conversionRate;
    this.expiresAt = expiresAt;
    this.region = region;
    this.approved = approved;
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

  canMoveTo(next: BidRuleAuditStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BidRuleAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"bid rule audit"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.conversionRate + this.expiresAt) * 100) / 100;
  }

  copy(): BidRuleAudit {
    return new BidRuleAudit(
      this.code,
      this.title,
      this.conversionRate,
      this.expiresAt,
      this.region,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a bid rule audit in status open. */
export function newBidRuleAudit(code: string, title: string): BidRuleAudit {
  return new BidRuleAudit(code, title, 0, 0, "", false, "open");
}
