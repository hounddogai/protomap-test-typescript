/**
 * The preference cycle records of consentcenter's preference work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a preference cycle is in its life cycle. */
export type PreferenceCycleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One preference cycle, with what the planners need to act on it. */
export class PreferenceCycle {
  code: string;
  name: string;
  margin: number;
  archived: boolean;
  campaignRef: string;
  status: PreferenceCycleStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    archived: boolean,
    campaignRef: string,
    status: PreferenceCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.archived = archived;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PreferenceCycleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PreferenceCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.margin;
  }

  copy(): PreferenceCycle {
    return new PreferenceCycle(this.code, this.name, this.margin, this.archived, this.campaignRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a preference cycle in status draft. */
export function newPreferenceCycle(code: string, name: string): PreferenceCycle {
  return new PreferenceCycle(code, name, 0, false, "", "draft");
}
