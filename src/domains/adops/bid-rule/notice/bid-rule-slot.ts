import * as text from "../../../../kit/text.js";

/** Where a bid rule slot is in its life cycle. */
export type BidRuleSlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One bid rule slot, with what the planners need to act on it. */
export class BidRuleSlot {
  code: string;
  label: string;
  createdAt: number;
  batchSize: number;
  conversionRate: number;
  active: boolean;
  channel: string;
  status: BidRuleSlotStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    batchSize: number,
    conversionRate: number,
    active: boolean,
    channel: string,
    status: BidRuleSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.batchSize = batchSize;
    this.conversionRate = conversionRate;
    this.active = active;
    this.channel = channel;
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

  canMoveTo(next: BidRuleSlotStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BidRuleSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"bid rule slot"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.createdAt - this.conversionRate) * 100) / 100;
  }

  copy(): BidRuleSlot {
    return new BidRuleSlot(
      this.code,
      this.label,
      this.createdAt,
      this.batchSize,
      this.conversionRate,
      this.active,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a bid rule slot in status open. */
export function newBidRuleSlot(code: string, label: string): BidRuleSlot {
  return new BidRuleSlot(code, label, 0, 0, 0, false, "", "open");
}
