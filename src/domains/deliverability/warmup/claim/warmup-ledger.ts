import * as text from "../../../../kit/text.js";

/** Where a warmup ledger is in its life cycle. */
export type WarmupLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a warmup ledger and its current status. */
export class WarmupLedger {
  code: string;
  name: string;
  conversionRate: number;
  endsAt: number;
  limit: number;
  impressions: number;
  bid: number;
  score: number;
  priority: number;
  reviewer: string;
  channel: string;
  status: WarmupLedgerStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    endsAt: number,
    limit: number,
    impressions: number,
    bid: number,
    score: number,
    priority: number,
    reviewer: string,
    channel: string,
    status: WarmupLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.endsAt = endsAt;
    this.limit = limit;
    this.impressions = impressions;
    this.bid = bid;
    this.score = score;
    this.priority = priority;
    this.reviewer = reviewer;
    this.channel = channel;
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

  canMoveTo(next: WarmupLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: WarmupLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round((this.endsAt + this.limit) * 100) / 100;
  }

  copy(): WarmupLedger {
    return new WarmupLedger(
      this.code,
      this.name,
      this.conversionRate,
      this.endsAt,
      this.limit,
      this.impressions,
      this.bid,
      this.score,
      this.priority,
      this.reviewer,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a warmup ledger in status proposed. */
export function newWarmupLedger(code: string, name: string): WarmupLedger {
  return new WarmupLedger(code, name, 0, 0, 0, 0, 0, 0, 0, "", "", "proposed");
}
