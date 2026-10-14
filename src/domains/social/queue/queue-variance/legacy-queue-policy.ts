import * as text from "../../../../kit/text.js";

/** Where a legacy queue policy is in its life cycle. */
export type LegacyQueuePolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a legacy queue policy and its current status. */
export class LegacyQueuePolicy {
  code: string;
  label: string;
  budget: number;
  journeyId: string;
  bid: number;
  currency: string;
  source: string;
  sendAt: number;
  status: LegacyQueuePolicyStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    journeyId: string,
    bid: number,
    currency: string,
    source: string,
    sendAt: number,
    status: LegacyQueuePolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.journeyId = journeyId;
    this.bid = bid;
    this.currency = currency;
    this.source = source;
    this.sendAt = sendAt;
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

  canMoveTo(next: LegacyQueuePolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LegacyQueuePolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy queue policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedTotal(): number {
    return Math.round(this.bid * this.sendAt * 100) / 100;
  }

  copy(): LegacyQueuePolicy {
    return new LegacyQueuePolicy(
      this.code,
      this.label,
      this.budget,
      this.journeyId,
      this.bid,
      this.currency,
      this.source,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a legacy queue policy in status proposed. */
export function newLegacyQueuePolicy(code: string, label: string): LegacyQueuePolicy {
  return new LegacyQueuePolicy(code, label, 0, "", 0, "", "", 0, "proposed");
}
