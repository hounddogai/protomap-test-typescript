/**
 * The fallback credit slot records of attribution's credit work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback credit slot is in its life cycle. */
export type FallbackCreditSlotStatus = "created" | "validated" | "published" | "retired";

/** A fallback credit slot. Its code is unique within a tenant. */
export class FallbackCreditSlot {
  code: string;
  name: string;
  cost: number;
  tags: string[];
  windowDays: number;
  endsAt: number;
  notes: string;
  status: FallbackCreditSlotStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    tags: string[],
    windowDays: number,
    endsAt: number,
    notes: string,
    status: FallbackCreditSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.tags = tags;
    this.windowDays = windowDays;
    this.endsAt = endsAt;
    this.notes = notes;
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

  canMoveTo(next: FallbackCreditSlotStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FallbackCreditSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback credit slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveExposure(): number {
    return Math.round((this.cost - this.windowDays) * 100) / 100;
  }

  copy(): FallbackCreditSlot {
    return new FallbackCreditSlot(
      this.code,
      this.name,
      this.cost,
      this.tags,
      this.windowDays,
      this.endsAt,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback credit slot in status created. */
export function newFallbackCreditSlot(code: string, name: string): FallbackCreditSlot {
  return new FallbackCreditSlot(code, name, 0, [], 0, 0, "", "created");
}
