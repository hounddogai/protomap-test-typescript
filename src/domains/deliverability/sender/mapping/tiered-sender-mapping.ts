/**
 * The tiered sender mapping records of deliverability's sender work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered sender mapping is in its life cycle. */
export type TieredSenderMappingStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered sender mapping. Its code is unique within a tenant. */
export class TieredSenderMapping {
  code: string;
  name: string;
  ownerId: string;
  maximum: number;
  amount: number;
  discount: number;
  status: TieredSenderMappingStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    maximum: number,
    amount: number,
    discount: number,
    status: TieredSenderMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.maximum = maximum;
    this.amount = amount;
    this.discount = discount;
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

  canMoveTo(next: TieredSenderMappingStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
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

  moveTo(next: TieredSenderMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered sender mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tiered sender mapping"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.amount - this.maximum) * 100) / 100;
  }

  copy(): TieredSenderMapping {
    return new TieredSenderMapping(
      this.code,
      this.name,
      this.ownerId,
      this.maximum,
      this.amount,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered sender mapping in status new. */
export function newTieredSenderMapping(code: string, name: string): TieredSenderMapping {
  return new TieredSenderMapping(code, name, "", 0, 0, 0, "new");
}
