import * as text from "../../../../kit/text.js";

/** Where a fallback retention tier is in its life cycle. */
export type FallbackRetentionTierStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A fallback retention tier as the retention team keeps it. */
export class FallbackRetentionTier {
  code: string;
  title: string;
  bid: number;
  rate: number;
  notes: string;
  budget: number;
  status: FallbackRetentionTierStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    rate: number,
    notes: string,
    budget: number,
    status: FallbackRetentionTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.rate = rate;
    this.notes = notes;
    this.budget = budget;
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

  canMoveTo(next: FallbackRetentionTierStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: FallbackRetentionTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback retention tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.rate - this.bid) * 100) / 100;
  }

  copy(): FallbackRetentionTier {
    return new FallbackRetentionTier(this.code, this.title, this.bid, this.rate, this.notes, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fallback retention tier in status proposed. */
export function newFallbackRetentionTier(code: string, title: string): FallbackRetentionTier {
  return new FallbackRetentionTier(code, title, 0, 0, "", 0, "proposed");
}
