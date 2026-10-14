import * as text from "../../../../kit/text.js";

/** Where a adaptive macro slot is in its life cycle. */
export type AdaptiveMacroSlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a adaptive macro slot and its current status. */
export class AdaptiveMacroSlot {
  code: string;
  name: string;
  capacity: number;
  category: string;
  currency: string;
  variant: string;
  channel: string;
  impressions: number;
  rate: number;
  quantity: number;
  status: AdaptiveMacroSlotStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    category: string,
    currency: string,
    variant: string,
    channel: string,
    impressions: number,
    rate: number,
    quantity: number,
    status: AdaptiveMacroSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.category = category;
    this.currency = currency;
    this.variant = variant;
    this.channel = channel;
    this.impressions = impressions;
    this.rate = rate;
    this.quantity = quantity;
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

  canMoveTo(next: AdaptiveMacroSlotStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: AdaptiveMacroSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive macro slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveValue(): number {
    return Math.round(this.quantity * this.impressions * 100) / 100;
  }

  copy(): AdaptiveMacroSlot {
    return new AdaptiveMacroSlot(
      this.code,
      this.name,
      this.capacity,
      this.category,
      this.currency,
      this.variant,
      this.channel,
      this.impressions,
      this.rate,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a adaptive macro slot in status open. */
export function newAdaptiveMacroSlot(code: string, name: string): AdaptiveMacroSlot {
  return new AdaptiveMacroSlot(code, name, 0, "", "", "", "", 0, 0, 0, "open");
}
