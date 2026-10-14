import * as text from "../../../../kit/text.js";

/** Where a primary path slot is in its life cycle. */
export type PrimaryPathSlotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a primary path slot and its current status. */
export class PrimaryPathSlot {
  code: string;
  name: string;
  budget: number;
  quantity: number;
  amount: number;
  active: boolean;
  cohort: string;
  weight: number;
  score: number;
  clicks: number;
  status: PrimaryPathSlotStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    quantity: number,
    amount: number,
    active: boolean,
    cohort: string,
    weight: number,
    score: number,
    clicks: number,
    status: PrimaryPathSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.quantity = quantity;
    this.amount = amount;
    this.active = active;
    this.cohort = cohort;
    this.weight = weight;
    this.score = score;
    this.clicks = clicks;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryPathSlotStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PrimaryPathSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary path slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedTotal(): number {
    return Math.round(this.quantity * this.clicks * 100) / 100;
  }

  copy(): PrimaryPathSlot {
    return new PrimaryPathSlot(
      this.code,
      this.name,
      this.budget,
      this.quantity,
      this.amount,
      this.active,
      this.cohort,
      this.weight,
      this.score,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary path slot in status draft. */
export function newPrimaryPathSlot(code: string, name: string): PrimaryPathSlot {
  return new PrimaryPathSlot(code, name, 0, 0, 0, false, "", 0, 0, 0, "draft");
}
