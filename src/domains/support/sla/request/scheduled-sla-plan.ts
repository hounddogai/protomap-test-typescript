import * as text from "../../../../kit/text.js";

/** Where a scheduled sla plan is in its life cycle. */
export type ScheduledSlaPlanStatus = "created" | "validated" | "published" | "retired";

/** A scheduled sla plan as the sla team keeps it. */
export class ScheduledSlaPlan {
  code: string;
  name: string;
  amount: number;
  sequence: number;
  segment: string;
  createdAt: number;
  bid: number;
  locale: string;
  batchSize: number;
  score: number;
  openRate: number;
  status: ScheduledSlaPlanStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    sequence: number,
    segment: string,
    createdAt: number,
    bid: number,
    locale: string,
    batchSize: number,
    score: number,
    openRate: number,
    status: ScheduledSlaPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.sequence = sequence;
    this.segment = segment;
    this.createdAt = createdAt;
    this.bid = bid;
    this.locale = locale;
    this.batchSize = batchSize;
    this.score = score;
    this.openRate = openRate;
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

  canMoveTo(next: ScheduledSlaPlanStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ScheduledSlaPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled sla plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netExposure(): number {
    return Math.round((this.openRate - this.createdAt) * 100) / 100;
  }

  copy(): ScheduledSlaPlan {
    return new ScheduledSlaPlan(
      this.code,
      this.name,
      this.amount,
      this.sequence,
      this.segment,
      this.createdAt,
      this.bid,
      this.locale,
      this.batchSize,
      this.score,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a scheduled sla plan in status created. */
export function newScheduledSlaPlan(code: string, name: string): ScheduledSlaPlan {
  return new ScheduledSlaPlan(code, name, 0, 0, "", 0, 0, "", 0, 0, 0, "created");
}
