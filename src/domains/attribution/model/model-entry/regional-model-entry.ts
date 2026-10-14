/**
 * The regional model entry records of attribution's model work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional model entry is in its life cycle. */
export type RegionalModelEntryStatus = "requested" | "granted" | "revoked" | "expired";

/** A regional model entry. Its code is unique within a tenant. */
export class RegionalModelEntry {
  code: string;
  title: string;
  attempts: number;
  checksum: string;
  quantity: number;
  budget: number;
  label: string;
  windowDays: number;
  status: RegionalModelEntryStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    checksum: string,
    quantity: number,
    budget: number,
    label: string,
    windowDays: number,
    status: RegionalModelEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.checksum = checksum;
    this.quantity = quantity;
    this.budget = budget;
    this.label = label;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalModelEntryStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalModelEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional model entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"regional model entry"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.quantity * this.attempts * 100) / 100;
  }

  copy(): RegionalModelEntry {
    return new RegionalModelEntry(
      this.code,
      this.title,
      this.attempts,
      this.checksum,
      this.quantity,
      this.budget,
      this.label,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional model entry in status requested. */
export function newRegionalModelEntry(code: string, title: string): RegionalModelEntry {
  return new RegionalModelEntry(code, title, 0, "", 0, 0, "", 0, "requested");
}
