import * as text from "../../../../kit/text.js";

/** Where a fallback step slot is in its life cycle. */
export type FallbackStepSlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a fallback step slot and its current status. */
export class FallbackStepSlot {
  code: string;
  name: string;
  openRate: number;
  quantity: number;
  currency: string;
  unit: string;
  discount: number;
  attempts: number;
  summary: string;
  ceiling: number;
  conversionRate: number;
  status: FallbackStepSlotStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    quantity: number,
    currency: string,
    unit: string,
    discount: number,
    attempts: number,
    summary: string,
    ceiling: number,
    conversionRate: number,
    status: FallbackStepSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.quantity = quantity;
    this.currency = currency;
    this.unit = unit;
    this.discount = discount;
    this.attempts = attempts;
    this.summary = summary;
    this.ceiling = ceiling;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: FallbackStepSlotStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
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

  moveTo(next: FallbackStepSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback step slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback step slot"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.openRate * this.attempts * 100) / 100;
  }

  copy(): FallbackStepSlot {
    return new FallbackStepSlot(
      this.code,
      this.name,
      this.openRate,
      this.quantity,
      this.currency,
      this.unit,
      this.discount,
      this.attempts,
      this.summary,
      this.ceiling,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a fallback step slot in status open. */
export function newFallbackStepSlot(code: string, name: string): FallbackStepSlot {
  return new FallbackStepSlot(code, name, 0, 0, "", "", 0, 0, "", 0, 0, "open");
}
