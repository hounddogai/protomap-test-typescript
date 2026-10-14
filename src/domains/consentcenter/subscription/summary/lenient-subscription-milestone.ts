import * as text from "../../../../kit/text.js";

/** Where a lenient subscription milestone is in its life cycle. */
export type LenientSubscriptionMilestoneStatus = "new" | "queued" | "running" | "done" | "failed";

/** One lenient subscription milestone, with what the planners need to act on it. */
export class LenientSubscriptionMilestone {
  code: string;
  title: string;
  bid: number;
  contactEmail: string;
  amount: number;
  category: string;
  budget: number;
  segment: string;
  attempts: number;
  active: boolean;
  batchSize: number;
  status: LenientSubscriptionMilestoneStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    contactEmail: string,
    amount: number,
    category: string,
    budget: number,
    segment: string,
    attempts: number,
    active: boolean,
    batchSize: number,
    status: LenientSubscriptionMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.contactEmail = contactEmail;
    this.amount = amount;
    this.category = category;
    this.budget = budget;
    this.segment = segment;
    this.attempts = attempts;
    this.active = active;
    this.batchSize = batchSize;
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

  canMoveTo(next: LenientSubscriptionMilestoneStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
          case "done":
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

  moveTo(next: LenientSubscriptionMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient subscription milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedTotal(): number {
    return Math.round(this.budget * this.bid * 100) / 100;
  }

  copy(): LenientSubscriptionMilestone {
    return new LenientSubscriptionMilestone(
      this.code,
      this.title,
      this.bid,
      this.contactEmail,
      this.amount,
      this.category,
      this.budget,
      this.segment,
      this.attempts,
      this.active,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a lenient subscription milestone in status new. */
export function newLenientSubscriptionMilestone(code: string, title: string): LenientSubscriptionMilestone {
  return new LenientSubscriptionMilestone(code, title, 0, "", 0, "", 0, "", 0, false, 0, "new");
}
