import * as text from "../../../../kit/text.js";

/** Where a tiered preference snapshot is in its life cycle. */
export type TieredPreferenceSnapshotStatus = "created" | "validated" | "published" | "retired";

/** A tiered preference snapshot as the preference team keeps it. */
export class TieredPreferenceSnapshot {
  code: string;
  name: string;
  bid: number;
  unit: string;
  variant: string;
  ownerId: string;
  createdAt: number;
  budget: number;
  phone: string;
  conversionRate: number;
  status: TieredPreferenceSnapshotStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    unit: string,
    variant: string,
    ownerId: string,
    createdAt: number,
    budget: number,
    phone: string,
    conversionRate: number,
    status: TieredPreferenceSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.unit = unit;
    this.variant = variant;
    this.ownerId = ownerId;
    this.createdAt = createdAt;
    this.budget = budget;
    this.phone = phone;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: TieredPreferenceSnapshotStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredPreferenceSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered preference snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedExposure(): number {
    return Math.round((this.bid + this.budget) * 100) / 100;
  }

  copy(): TieredPreferenceSnapshot {
    return new TieredPreferenceSnapshot(
      this.code,
      this.name,
      this.bid,
      this.unit,
      this.variant,
      this.ownerId,
      this.createdAt,
      this.budget,
      this.phone,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a tiered preference snapshot in status created. */
export function newTieredPreferenceSnapshot(code: string, name: string): TieredPreferenceSnapshot {
  return new TieredPreferenceSnapshot(code, name, 0, "", "", "", 0, 0, "", 0, "created");
}
