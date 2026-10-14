import * as text from "../../../../kit/text.js";

/** Where a strict reply claim is in its life cycle. */
export type StrictReplyClaimStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a strict reply claim and its current status. */
export class StrictReplyClaim {
  code: string;
  title: string;
  endsAt: number;
  category: string;
  minimum: number;
  amount: number;
  ownerId: string;
  region: string;
  budget: number;
  ceiling: number;
  status: StrictReplyClaimStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    category: string,
    minimum: number,
    amount: number,
    ownerId: string,
    region: string,
    budget: number,
    ceiling: number,
    status: StrictReplyClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.category = category;
    this.minimum = minimum;
    this.amount = amount;
    this.ownerId = ownerId;
    this.region = region;
    this.budget = budget;
    this.ceiling = ceiling;
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

  canMoveTo(next: StrictReplyClaimStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
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

  moveTo(next: StrictReplyClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict reply claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"strict reply claim"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round(this.endsAt * this.ceiling * 100) / 100;
  }

  copy(): StrictReplyClaim {
    return new StrictReplyClaim(
      this.code,
      this.title,
      this.endsAt,
      this.category,
      this.minimum,
      this.amount,
      this.ownerId,
      this.region,
      this.budget,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a strict reply claim in status new. */
export function newStrictReplyClaim(code: string, title: string): StrictReplyClaim {
  return new StrictReplyClaim(code, title, 0, "", 0, 0, "", "", 0, 0, "new");
}
