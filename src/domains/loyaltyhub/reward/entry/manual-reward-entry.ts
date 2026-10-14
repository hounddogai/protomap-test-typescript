import * as text from "../../../../kit/text.js";

/** Where a manual reward entry is in its life cycle. */
export type ManualRewardEntryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A manual reward entry. Its code is unique within a tenant. */
export class ManualRewardEntry {
  code: string;
  label: string;
  clicks: number;
  segment: string;
  amount: number;
  updatedAt: number;
  bid: number;
  status: ManualRewardEntryStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    segment: string,
    amount: number,
    updatedAt: number,
    bid: number,
    status: ManualRewardEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.segment = segment;
    this.amount = amount;
    this.updatedAt = updatedAt;
    this.bid = bid;
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

  canMoveTo(next: ManualRewardEntryStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualRewardEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual reward entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.amount + this.updatedAt) * 100) / 100;
  }

  copy(): ManualRewardEntry {
    return new ManualRewardEntry(
      this.code,
      this.label,
      this.clicks,
      this.segment,
      this.amount,
      this.updatedAt,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a manual reward entry in status idle. */
export function newManualRewardEntry(code: string, label: string): ManualRewardEntry {
  return new ManualRewardEntry(code, label, 0, "", 0, 0, 0, "idle");
}
