import * as text from "../../../../kit/text.js";

/** Where a tiered reward slot is in its life cycle. */
export type TieredRewardSlotStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered reward slot. Its code is unique within a tenant. */
export class TieredRewardSlot {
  code: string;
  name: string;
  discount: number;
  expiresAt: number;
  notes: string;
  budget: number;
  externalRef: string;
  version: number;
  windowDays: number;
  status: TieredRewardSlotStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    expiresAt: number,
    notes: string,
    budget: number,
    externalRef: string,
    version: number,
    windowDays: number,
    status: TieredRewardSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.expiresAt = expiresAt;
    this.notes = notes;
    this.budget = budget;
    this.externalRef = externalRef;
    this.version = version;
    this.windowDays = windowDays;
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

  canMoveTo(next: TieredRewardSlotStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredRewardSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reward slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveValue(): number {
    return Math.round((this.version + this.windowDays) * 100) / 100;
  }

  copy(): TieredRewardSlot {
    return new TieredRewardSlot(
      this.code,
      this.name,
      this.discount,
      this.expiresAt,
      this.notes,
      this.budget,
      this.externalRef,
      this.version,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered reward slot in status new. */
export function newTieredRewardSlot(code: string, name: string): TieredRewardSlot {
  return new TieredRewardSlot(code, name, 0, 0, "", 0, "", 0, 0, "new");
}
