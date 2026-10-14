import * as text from "../../../../kit/text.js";

/** Where a regional credit audit is in its life cycle. */
export type RegionalCreditAuditStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A regional credit audit as the credit team keeps it. */
export class RegionalCreditAudit {
  code: string;
  title: string;
  currency: string;
  source: string;
  rate: number;
  updatedAt: number;
  threshold: number;
  graceDays: number;
  createdAt: number;
  weight: number;
  status: RegionalCreditAuditStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    source: string,
    rate: number,
    updatedAt: number,
    threshold: number,
    graceDays: number,
    createdAt: number,
    weight: number,
    status: RegionalCreditAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.source = source;
    this.rate = rate;
    this.updatedAt = updatedAt;
    this.threshold = threshold;
    this.graceDays = graceDays;
    this.createdAt = createdAt;
    this.weight = weight;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalCreditAuditStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalCreditAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional credit audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedValue(): number {
    return Math.round((this.graceDays + this.weight) * 100) / 100;
  }

  copy(): RegionalCreditAudit {
    return new RegionalCreditAudit(
      this.code,
      this.title,
      this.currency,
      this.source,
      this.rate,
      this.updatedAt,
      this.threshold,
      this.graceDays,
      this.createdAt,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a regional credit audit in status proposed. */
export function newRegionalCreditAudit(code: string, title: string): RegionalCreditAudit {
  return new RegionalCreditAudit(code, title, "", "", 0, 0, 0, 0, 0, 0, "proposed");
}
