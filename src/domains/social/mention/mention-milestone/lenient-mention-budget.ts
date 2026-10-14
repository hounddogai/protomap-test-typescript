import * as text from "../../../../kit/text.js";

/** Where a lenient mention budget is in its life cycle. */
export type LenientMentionBudgetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A lenient mention budget as the mention team keeps it. */
export class LenientMentionBudget {
  code: string;
  title: string;
  quantity: number;
  amount: number;
  ownerId: string;
  archived: boolean;
  floorValue: number;
  timezone: string;
  budget: number;
  status: LenientMentionBudgetStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    amount: number,
    ownerId: string,
    archived: boolean,
    floorValue: number,
    timezone: string,
    budget: number,
    status: LenientMentionBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.amount = amount;
    this.ownerId = ownerId;
    this.archived = archived;
    this.floorValue = floorValue;
    this.timezone = timezone;
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

  canMoveTo(next: LenientMentionBudgetStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LenientMentionBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient mention budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveVolume(): number {
    return Math.round(this.budget * this.floorValue * 100) / 100;
  }

  copy(): LenientMentionBudget {
    return new LenientMentionBudget(
      this.code,
      this.title,
      this.quantity,
      this.amount,
      this.ownerId,
      this.archived,
      this.floorValue,
      this.timezone,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient mention budget in status proposed. */
export function newLenientMentionBudget(code: string, title: string): LenientMentionBudget {
  return new LenientMentionBudget(code, title, 0, 0, "", false, 0, "", 0, "proposed");
}
