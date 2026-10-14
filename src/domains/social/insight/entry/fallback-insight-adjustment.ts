import * as text from "../../../../kit/text.js";

/** Where a fallback insight adjustment is in its life cycle. */
export type FallbackInsightAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A fallback insight adjustment as the insight team keeps it. */
export class FallbackInsightAdjustment {
  code: string;
  name: string;
  rate: number;
  bid: number;
  pinned: boolean;
  status: FallbackInsightAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    bid: number,
    pinned: boolean,
    status: FallbackInsightAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.bid = bid;
    this.pinned = pinned;
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

  canMoveTo(next: FallbackInsightAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
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

  moveTo(next: FallbackInsightAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback insight adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback insight adjustment"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.rate + this.bid) * 100) / 100;
  }

  copy(): FallbackInsightAdjustment {
    return new FallbackInsightAdjustment(this.code, this.name, this.rate, this.bid, this.pinned, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback insight adjustment in status new. */
export function newFallbackInsightAdjustment(code: string, name: string): FallbackInsightAdjustment {
  return new FallbackInsightAdjustment(code, name, 0, 0, false, "new");
}
