/**
 * The level ledger records of loyaltyhub's level work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a level ledger is in its life cycle. */
export type LevelLedgerStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A level ledger. Its code is unique within a tenant. */
export class LevelLedger {
  code: string;
  name: string;
  country: string;
  impressions: number;
  updatedAt: number;
  category: string;
  ceiling: number;
  capacity: number;
  phone: string;
  ownerId: string;
  status: LevelLedgerStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    impressions: number,
    updatedAt: number,
    category: string,
    ceiling: number,
    capacity: number,
    phone: string,
    ownerId: string,
    status: LevelLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.impressions = impressions;
    this.updatedAt = updatedAt;
    this.category = category;
    this.ceiling = ceiling;
    this.capacity = capacity;
    this.phone = phone;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LevelLedgerStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LevelLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"level ledger"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.ceiling + this.impressions) * 100) / 100;
  }

  copy(): LevelLedger {
    return new LevelLedger(
      this.code,
      this.name,
      this.country,
      this.impressions,
      this.updatedAt,
      this.category,
      this.ceiling,
      this.capacity,
      this.phone,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a level ledger in status open. */
export function newLevelLedger(code: string, name: string): LevelLedger {
  return new LevelLedger(code, name, "", 0, 0, "", 0, 0, "", "", "open");
}
