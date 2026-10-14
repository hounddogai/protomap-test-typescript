import * as text from "../../../../kit/text.js";

/** Where a manual payout batch is in its life cycle. */
export type ManualPayoutBatchStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A manual payout batch as the payout team keeps it. */
export class ManualPayoutBatch {
  code: string;
  title: string;
  approved: boolean;
  rate: number;
  channel: string;
  createdAt: number;
  margin: number;
  startsAt: number;
  unit: string;
  status: ManualPayoutBatchStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    rate: number,
    channel: string,
    createdAt: number,
    margin: number,
    startsAt: number,
    unit: string,
    status: ManualPayoutBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.rate = rate;
    this.channel = channel;
    this.createdAt = createdAt;
    this.margin = margin;
    this.startsAt = startsAt;
    this.unit = unit;
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

  canMoveTo(next: ManualPayoutBatchStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualPayoutBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual payout batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"manual payout batch"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.margin * this.rate * 100) / 100;
  }

  copy(): ManualPayoutBatch {
    return new ManualPayoutBatch(
      this.code,
      this.title,
      this.approved,
      this.rate,
      this.channel,
      this.createdAt,
      this.margin,
      this.startsAt,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual payout batch in status draft. */
export function newManualPayoutBatch(code: string, title: string): ManualPayoutBatch {
  return new ManualPayoutBatch(code, title, false, 0, "", 0, 0, 0, "", "draft");
}
