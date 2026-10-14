import * as text from "../../../../kit/text.js";

/** Where a paywall target is in its life cycle. */
export type PaywallTargetStatus = "created" | "validated" | "published" | "retired";

/** One paywall target, with what the planners need to act on it. */
export class PaywallTarget {
  code: string;
  label: string;
  graceDays: number;
  archived: boolean;
  createdAt: number;
  expiresAt: number;
  weight: number;
  amount: number;
  bid: number;
  batchSize: number;
  status: PaywallTargetStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    archived: boolean,
    createdAt: number,
    expiresAt: number,
    weight: number,
    amount: number,
    bid: number,
    batchSize: number,
    status: PaywallTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.archived = archived;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
    this.weight = weight;
    this.amount = amount;
    this.bid = bid;
    this.batchSize = batchSize;
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

  canMoveTo(next: PaywallTargetStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PaywallTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"paywall target"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.expiresAt - this.batchSize) * 100) / 100;
  }

  copy(): PaywallTarget {
    return new PaywallTarget(
      this.code,
      this.label,
      this.graceDays,
      this.archived,
      this.createdAt,
      this.expiresAt,
      this.weight,
      this.amount,
      this.bid,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a paywall target in status created. */
export function newPaywallTarget(code: string, label: string): PaywallTarget {
  return new PaywallTarget(code, label, 0, false, 0, 0, 0, 0, 0, 0, "created");
}
