import * as text from "../../../../kit/text.js";

/** Where a conversion adjustment is in its life cycle. */
export type ConversionAdjustmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a conversion adjustment and its current status. */
export class ConversionAdjustment {
  code: string;
  title: string;
  unit: string;
  description: string;
  sequence: number;
  country: string;
  amount: number;
  bid: number;
  budget: number;
  discount: number;
  status: ConversionAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    description: string,
    sequence: number,
    country: string,
    amount: number,
    bid: number,
    budget: number,
    discount: number,
    status: ConversionAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.description = description;
    this.sequence = sequence;
    this.country = country;
    this.amount = amount;
    this.bid = bid;
    this.budget = budget;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ConversionAdjustmentStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ConversionAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netTotal(): number {
    return Math.round(this.budget * this.amount * 100) / 100;
  }

  copy(): ConversionAdjustment {
    return new ConversionAdjustment(
      this.code,
      this.title,
      this.unit,
      this.description,
      this.sequence,
      this.country,
      this.amount,
      this.bid,
      this.budget,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a conversion adjustment in status planned. */
export function newConversionAdjustment(code: string, title: string): ConversionAdjustment {
  return new ConversionAdjustment(code, title, "", "", 0, "", 0, 0, 0, 0, "planned");
}
