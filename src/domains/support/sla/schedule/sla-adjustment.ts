import * as text from "../../../../kit/text.js";

/** Where a sla adjustment is in its life cycle. */
export type SlaAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A sla adjustment. Its code is unique within a tenant. */
export class SlaAdjustment {
  code: string;
  title: string;
  score: number;
  sequence: number;
  region: string;
  amount: number;
  checksum: string;
  timezone: string;
  bid: number;
  status: SlaAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    sequence: number,
    region: string,
    amount: number,
    checksum: string,
    timezone: string,
    bid: number,
    status: SlaAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.sequence = sequence;
    this.region = region;
    this.amount = amount;
    this.checksum = checksum;
    this.timezone = timezone;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SlaAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveExposure(): number {
    return Math.round((this.score + this.bid) * 100) / 100;
  }

  copy(): SlaAdjustment {
    return new SlaAdjustment(
      this.code,
      this.title,
      this.score,
      this.sequence,
      this.region,
      this.amount,
      this.checksum,
      this.timezone,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a sla adjustment in status new. */
export function newSlaAdjustment(code: string, title: string): SlaAdjustment {
  return new SlaAdjustment(code, title, 0, 0, "", 0, "", "", 0, "new");
}
