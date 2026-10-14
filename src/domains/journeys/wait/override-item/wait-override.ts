/**
 * The wait override records of journeys's wait work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a wait override is in its life cycle. */
export type WaitOverrideStatus = "created" | "validated" | "published" | "retired";

/** A wait override as the wait team keeps it. */
export class WaitOverride {
  code: string;
  label: string;
  pinned: boolean;
  budget: number;
  sendAt: number;
  margin: number;
  status: WaitOverrideStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    budget: number,
    sendAt: number,
    margin: number,
    status: WaitOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.budget = budget;
    this.sendAt = sendAt;
    this.margin = margin;
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

  canMoveTo(next: WaitOverrideStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
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

  moveTo(next: WaitOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedVolume(): number {
    return Math.round((this.margin - this.sendAt) * 100) / 100;
  }

  copy(): WaitOverride {
    return new WaitOverride(this.code, this.label, this.pinned, this.budget, this.sendAt, this.margin, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a wait override in status created. */
export function newWaitOverride(code: string, label: string): WaitOverride {
  return new WaitOverride(code, label, false, 0, 0, 0, "created");
}
