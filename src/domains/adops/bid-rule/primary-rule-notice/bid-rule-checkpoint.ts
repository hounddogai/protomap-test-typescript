import * as text from "../../../../kit/text.js";

/** Where a bid rule checkpoint is in its life cycle. */
export type BidRuleCheckpointStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a bid rule checkpoint and its current status. */
export class BidRuleCheckpoint {
  code: string;
  label: string;
  maximum: number;
  rate: number;
  checksum: string;
  reviewer: string;
  currency: string;
  name: string;
  startsAt: number;
  status: BidRuleCheckpointStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    rate: number,
    checksum: string,
    reviewer: string,
    currency: string,
    name: string,
    startsAt: number,
    status: BidRuleCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.rate = rate;
    this.checksum = checksum;
    this.reviewer = reviewer;
    this.currency = currency;
    this.name = name;
    this.startsAt = startsAt;
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

  canMoveTo(next: BidRuleCheckpointStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BidRuleCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"bid rule checkpoint"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.startsAt - this.maximum) * 100) / 100;
  }

  copy(): BidRuleCheckpoint {
    return new BidRuleCheckpoint(
      this.code,
      this.label,
      this.maximum,
      this.rate,
      this.checksum,
      this.reviewer,
      this.currency,
      this.name,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a bid rule checkpoint in status new. */
export function newBidRuleCheckpoint(code: string, label: string): BidRuleCheckpoint {
  return new BidRuleCheckpoint(code, label, 0, 0, "", "", "", "", 0, "new");
}
