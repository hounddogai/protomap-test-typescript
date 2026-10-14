import * as text from "../../../../kit/text.js";

/** Where a funnel slot is in its life cycle. */
export type FunnelSlotStatus = "new" | "queued" | "running" | "done" | "failed";

/** One funnel slot, with what the planners need to act on it. */
export class FunnelSlot {
  code: string;
  name: string;
  pinned: boolean;
  ceiling: number;
  rate: number;
  quantity: number;
  tags: string[];
  sequence: number;
  capacity: number;
  contactEmail: string;
  graceDays: number;
  status: FunnelSlotStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    ceiling: number,
    rate: number,
    quantity: number,
    tags: string[],
    sequence: number,
    capacity: number,
    contactEmail: string,
    graceDays: number,
    status: FunnelSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.ceiling = ceiling;
    this.rate = rate;
    this.quantity = quantity;
    this.tags = tags;
    this.sequence = sequence;
    this.capacity = capacity;
    this.contactEmail = contactEmail;
    this.graceDays = graceDays;
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

  canMoveTo(next: FunnelSlotStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
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
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FunnelSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedExposure(): number {
    return Math.round((this.capacity + this.ceiling) * 100) / 100;
  }

  copy(): FunnelSlot {
    return new FunnelSlot(
      this.code,
      this.name,
      this.pinned,
      this.ceiling,
      this.rate,
      this.quantity,
      this.tags,
      this.sequence,
      this.capacity,
      this.contactEmail,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a funnel slot in status new. */
export function newFunnelSlot(code: string, name: string): FunnelSlot {
  return new FunnelSlot(code, name, false, 0, 0, 0, [], 0, 0, "", 0, "new");
}
