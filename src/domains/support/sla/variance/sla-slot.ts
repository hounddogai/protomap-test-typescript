import * as text from "../../../../kit/text.js";

/** Where a sla slot is in its life cycle. */
export type SlaSlotStatus = "created" | "validated" | "published" | "retired";

/** A sla slot. Its code is unique within a tenant. */
export class SlaSlot {
  code: string;
  label: string;
  graceDays: number;
  currency: string;
  segment: string;
  capacity: number;
  name: string;
  status: SlaSlotStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    currency: string,
    segment: string,
    capacity: number,
    name: string,
    status: SlaSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.currency = currency;
    this.segment = segment;
    this.capacity = capacity;
    this.name = name;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SlaSlotStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedTotal(): number {
    return Math.round(this.graceDays * this.capacity * 100) / 100;
  }

  copy(): SlaSlot {
    return new SlaSlot(
      this.code,
      this.label,
      this.graceDays,
      this.currency,
      this.segment,
      this.capacity,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a sla slot in status created. */
export function newSlaSlot(code: string, label: string): SlaSlot {
  return new SlaSlot(code, label, 0, "", "", 0, "", "created");
}
