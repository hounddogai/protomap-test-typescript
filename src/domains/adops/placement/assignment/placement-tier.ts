import * as text from "../../../../kit/text.js";

/** Where a placement tier is in its life cycle. */
export type PlacementTierStatus = "new" | "queued" | "running" | "done" | "failed";

/** A placement tier as the placement team keeps it. */
export class PlacementTier {
  code: string;
  name: string;
  description: string;
  amount: number;
  phone: string;
  graceDays: number;
  status: PlacementTierStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    amount: number,
    phone: string,
    graceDays: number,
    status: PlacementTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.amount = amount;
    this.phone = phone;
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

  canMoveTo(next: PlacementTierStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
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

  moveTo(next: PlacementTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.amount - this.graceDays) * 100) / 100;
  }

  copy(): PlacementTier {
    return new PlacementTier(
      this.code,
      this.name,
      this.description,
      this.amount,
      this.phone,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a placement tier in status new. */
export function newPlacementTier(code: string, name: string): PlacementTier {
  return new PlacementTier(code, name, "", 0, "", 0, "new");
}
