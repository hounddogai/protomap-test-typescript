/**
 * The preference ledger records of consentcenter's preference work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a preference ledger is in its life cycle. */
export type PreferenceLedgerStatus = "created" | "validated" | "published" | "retired";

/** A preference ledger as the preference team keeps it. */
export class PreferenceLedger {
  code: string;
  title: string;
  weight: number;
  notes: string;
  channel: string;
  priority: number;
  active: boolean;
  variant: string;
  status: PreferenceLedgerStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    notes: string,
    channel: string,
    priority: number,
    active: boolean,
    variant: string,
    status: PreferenceLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.notes = notes;
    this.channel = channel;
    this.priority = priority;
    this.active = active;
    this.variant = variant;
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

  canMoveTo(next: PreferenceLedgerStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PreferenceLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedExposure(): number {
    return Math.round((this.weight - this.priority) * 100) / 100;
  }

  copy(): PreferenceLedger {
    return new PreferenceLedger(
      this.code,
      this.title,
      this.weight,
      this.notes,
      this.channel,
      this.priority,
      this.active,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a preference ledger in status created. */
export function newPreferenceLedger(code: string, title: string): PreferenceLedger {
  return new PreferenceLedger(code, title, 0, "", "", 0, false, "", "created");
}
