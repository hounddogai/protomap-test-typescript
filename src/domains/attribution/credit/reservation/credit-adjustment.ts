import * as text from "../../../../kit/text.js";

/** Where a credit adjustment is in its life cycle. */
export type CreditAdjustmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A credit adjustment. Its code is unique within a tenant. */
export class CreditAdjustment {
  code: string;
  title: string;
  reviewer: string;
  region: string;
  audienceId: string;
  openRate: number;
  variant: string;
  source: string;
  bid: number;
  cost: number;
  expiresAt: number;
  status: CreditAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    region: string,
    audienceId: string,
    openRate: number,
    variant: string,
    source: string,
    bid: number,
    cost: number,
    expiresAt: number,
    status: CreditAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.region = region;
    this.audienceId = audienceId;
    this.openRate = openRate;
    this.variant = variant;
    this.source = source;
    this.bid = bid;
    this.cost = cost;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: CreditAdjustmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: CreditAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"credit adjustment"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.bid - this.expiresAt) * 100) / 100;
  }

  copy(): CreditAdjustment {
    return new CreditAdjustment(
      this.code,
      this.title,
      this.reviewer,
      this.region,
      this.audienceId,
      this.openRate,
      this.variant,
      this.source,
      this.bid,
      this.cost,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a credit adjustment in status proposed. */
export function newCreditAdjustment(code: string, title: string): CreditAdjustment {
  return new CreditAdjustment(code, title, "", "", "", 0, "", "", 0, 0, 0, "proposed");
}
