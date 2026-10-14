import * as text from "../../../../kit/text.js";

/** Where a strict credit entry is in its life cycle. */
export type StrictCreditEntryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One strict credit entry, with what the planners need to act on it. */
export class StrictCreditEntry {
  code: string;
  name: string;
  priority: number;
  currency: string;
  channel: string;
  startsAt: number;
  quantity: number;
  impressions: number;
  status: StrictCreditEntryStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    currency: string,
    channel: string,
    startsAt: number,
    quantity: number,
    impressions: number,
    status: StrictCreditEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.currency = currency;
    this.channel = channel;
    this.startsAt = startsAt;
    this.quantity = quantity;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictCreditEntryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictCreditEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict credit entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedTotal(): number {
    return Math.round((this.quantity - this.startsAt) * 100) / 100;
  }

  copy(): StrictCreditEntry {
    return new StrictCreditEntry(
      this.code,
      this.name,
      this.priority,
      this.currency,
      this.channel,
      this.startsAt,
      this.quantity,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict credit entry in status idle. */
export function newStrictCreditEntry(code: string, name: string): StrictCreditEntry {
  return new StrictCreditEntry(code, name, 0, "", "", 0, 0, 0, "idle");
}
