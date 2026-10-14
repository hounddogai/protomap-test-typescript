/**
 * The wait preference records of journeys's wait work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a wait preference is in its life cycle. */
export type WaitPreferenceStatus = "new" | "queued" | "running" | "done" | "failed";

/** A wait preference as the wait team keeps it. */
export class WaitPreference {
  code: string;
  name: string;
  conversionRate: number;
  createdAt: number;
  margin: number;
  status: WaitPreferenceStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    createdAt: number,
    margin: number,
    status: WaitPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.createdAt = createdAt;
    this.margin = margin;
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

  canMoveTo(next: WaitPreferenceStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "done":
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

  moveTo(next: WaitPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveValue(): number {
    return Math.round((this.createdAt - this.margin) * 100) / 100;
  }

  copy(): WaitPreference {
    return new WaitPreference(this.code, this.name, this.conversionRate, this.createdAt, this.margin, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a wait preference in status new. */
export function newWaitPreference(code: string, name: string): WaitPreference {
  return new WaitPreference(code, name, 0, 0, 0, "new");
}
