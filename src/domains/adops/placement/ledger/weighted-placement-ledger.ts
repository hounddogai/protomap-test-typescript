/**
 * The weighted placement ledger records of adops's placement work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted placement ledger is in its life cycle. */
export type WeightedPlacementLedgerStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A weighted placement ledger as the placement team keeps it. */
export class WeightedPlacementLedger {
  code: string;
  title: string;
  cost: number;
  country: string;
  notes: string;
  channel: string;
  status: WeightedPlacementLedgerStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    country: string,
    notes: string,
    channel: string,
    status: WeightedPlacementLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.country = country;
    this.notes = notes;
    this.channel = channel;
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

  canMoveTo(next: WeightedPlacementLedgerStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedPlacementLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted placement ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.cost;
  }

  copy(): WeightedPlacementLedger {
    return new WeightedPlacementLedger(
      this.code,
      this.title,
      this.cost,
      this.country,
      this.notes,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a weighted placement ledger in status draft. */
export function newWeightedPlacementLedger(code: string, title: string): WeightedPlacementLedger {
  return new WeightedPlacementLedger(code, title, 0, "", "", "", "draft");
}
