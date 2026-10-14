/**
 * The strict tier slot records of referral's tier work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict tier slot is in its life cycle. */
export type StrictTierSlotStatus = "created" | "validated" | "published" | "retired";

/** The record of a strict tier slot and its current status. */
export class StrictTierSlot {
  code: string;
  label: string;
  title: string;
  ownerId: string;
  createdAt: number;
  phone: string;
  status: StrictTierSlotStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    ownerId: string,
    createdAt: number,
    phone: string,
    status: StrictTierSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.ownerId = ownerId;
    this.createdAt = createdAt;
    this.phone = phone;
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

  canMoveTo(next: StrictTierSlotStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
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

  moveTo(next: StrictTierSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict tier slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): StrictTierSlot {
    return new StrictTierSlot(this.code, this.label, this.title, this.ownerId, this.createdAt, this.phone, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict tier slot in status created. */
export function newStrictTierSlot(code: string, label: string): StrictTierSlot {
  return new StrictTierSlot(code, label, "", "", 0, "", "created");
}
