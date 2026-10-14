import * as text from "../../../../kit/text.js";

/** Where a capped frequency slot is in its life cycle. */
export type CappedFrequencySlotStatus = "requested" | "granted" | "revoked" | "expired";

/** A capped frequency slot. Its code is unique within a tenant. */
export class CappedFrequencySlot {
  code: string;
  name: string;
  quantity: number;
  channel: string;
  currency: string;
  weight: number;
  budget: number;
  notes: string;
  status: CappedFrequencySlotStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    channel: string,
    currency: string,
    weight: number,
    budget: number,
    notes: string,
    status: CappedFrequencySlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.channel = channel;
    this.currency = currency;
    this.weight = weight;
    this.budget = budget;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedFrequencySlotStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: CappedFrequencySlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped frequency slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"capped frequency slot"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.weight + this.budget) * 100) / 100;
  }

  copy(): CappedFrequencySlot {
    return new CappedFrequencySlot(
      this.code,
      this.name,
      this.quantity,
      this.channel,
      this.currency,
      this.weight,
      this.budget,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a capped frequency slot in status requested. */
export function newCappedFrequencySlot(code: string, name: string): CappedFrequencySlot {
  return new CappedFrequencySlot(code, name, 0, "", "", 0, 0, "", "requested");
}
