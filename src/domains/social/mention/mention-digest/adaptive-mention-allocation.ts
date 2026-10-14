import * as text from "../../../../kit/text.js";

/** Where a adaptive mention allocation is in its life cycle. */
export type AdaptiveMentionAllocationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a adaptive mention allocation and its current status. */
export class AdaptiveMentionAllocation {
  code: string;
  name: string;
  currency: string;
  score: number;
  maximum: number;
  pinned: boolean;
  ceiling: number;
  archived: boolean;
  bid: number;
  status: AdaptiveMentionAllocationStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    score: number,
    maximum: number,
    pinned: boolean,
    ceiling: number,
    archived: boolean,
    bid: number,
    status: AdaptiveMentionAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.score = score;
    this.maximum = maximum;
    this.pinned = pinned;
    this.ceiling = ceiling;
    this.archived = archived;
    this.bid = bid;
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

  canMoveTo(next: AdaptiveMentionAllocationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveMentionAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive mention allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netValue(): number {
    return Math.round((this.ceiling + this.maximum) * 100) / 100;
  }

  copy(): AdaptiveMentionAllocation {
    return new AdaptiveMentionAllocation(
      this.code,
      this.name,
      this.currency,
      this.score,
      this.maximum,
      this.pinned,
      this.ceiling,
      this.archived,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive mention allocation in status open. */
export function newAdaptiveMentionAllocation(code: string, name: string): AdaptiveMentionAllocation {
  return new AdaptiveMentionAllocation(code, name, "", 0, 0, false, 0, false, 0, "open");
}
