import * as text from "../../../../kit/text.js";

/** Where a rolling placement ledger is in its life cycle. */
export type RollingPlacementLedgerStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a rolling placement ledger and its current status. */
export class RollingPlacementLedger {
  code: string;
  name: string;
  capacity: number;
  title: string;
  notes: string;
  currency: string;
  discount: number;
  active: boolean;
  quantity: number;
  status: RollingPlacementLedgerStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    title: string,
    notes: string,
    currency: string,
    discount: number,
    active: boolean,
    quantity: number,
    status: RollingPlacementLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.title = title;
    this.notes = notes;
    this.currency = currency;
    this.discount = discount;
    this.active = active;
    this.quantity = quantity;
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

  canMoveTo(next: RollingPlacementLedgerStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RollingPlacementLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling placement ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round(this.quantity * this.discount * 100) / 100;
  }

  copy(): RollingPlacementLedger {
    return new RollingPlacementLedger(
      this.code,
      this.name,
      this.capacity,
      this.title,
      this.notes,
      this.currency,
      this.discount,
      this.active,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling placement ledger in status idle. */
export function newRollingPlacementLedger(code: string, name: string): RollingPlacementLedger {
  return new RollingPlacementLedger(code, name, 0, "", "", "", 0, false, 0, "idle");
}
