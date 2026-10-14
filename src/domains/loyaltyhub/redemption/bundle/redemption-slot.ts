import * as text from "../../../../kit/text.js";

/** Where a redemption slot is in its life cycle. */
export type RedemptionSlotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One redemption slot, with what the planners need to act on it. */
export class RedemptionSlot {
  code: string;
  name: string;
  channel: string;
  floorValue: number;
  category: string;
  priority: number;
  pinned: boolean;
  variant: string;
  minimum: number;
  budget: number;
  capacity: number;
  status: RedemptionSlotStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    floorValue: number,
    category: string,
    priority: number,
    pinned: boolean,
    variant: string,
    minimum: number,
    budget: number,
    capacity: number,
    status: RedemptionSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.floorValue = floorValue;
    this.category = category;
    this.priority = priority;
    this.pinned = pinned;
    this.variant = variant;
    this.minimum = minimum;
    this.budget = budget;
    this.capacity = capacity;
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

  canMoveTo(next: RedemptionSlotStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RedemptionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netValue(): number {
    return Math.round((this.floorValue + this.minimum) * 100) / 100;
  }

  copy(): RedemptionSlot {
    return new RedemptionSlot(
      this.code,
      this.name,
      this.channel,
      this.floorValue,
      this.category,
      this.priority,
      this.pinned,
      this.variant,
      this.minimum,
      this.budget,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a redemption slot in status draft. */
export function newRedemptionSlot(code: string, name: string): RedemptionSlot {
  return new RedemptionSlot(code, name, "", 0, "", 0, false, "", 0, 0, 0, "draft");
}
