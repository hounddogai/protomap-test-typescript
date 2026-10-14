import * as text from "../../../../kit/text.js";

/** Where a retention ledger is in its life cycle. */
export type RetentionLedgerStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A retention ledger. Its code is unique within a tenant. */
export class RetentionLedger {
  code: string;
  name: string;
  cost: number;
  segment: string;
  conversionRate: number;
  campaignRef: string;
  maximum: number;
  ratio: number;
  status: RetentionLedgerStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    segment: string,
    conversionRate: number,
    campaignRef: string,
    maximum: number,
    ratio: number,
    status: RetentionLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.segment = segment;
    this.conversionRate = conversionRate;
    this.campaignRef = campaignRef;
    this.maximum = maximum;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: RetentionLedgerStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RetentionLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedTotal(): number {
    return Math.round((this.ratio - this.cost) * 100) / 100;
  }

  copy(): RetentionLedger {
    return new RetentionLedger(
      this.code,
      this.name,
      this.cost,
      this.segment,
      this.conversionRate,
      this.campaignRef,
      this.maximum,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a retention ledger in status idle. */
export function newRetentionLedger(code: string, name: string): RetentionLedger {
  return new RetentionLedger(code, name, 0, "", 0, "", 0, 0, "idle");
}
