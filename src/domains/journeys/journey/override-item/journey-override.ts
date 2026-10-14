/**
 * The journey override records of journeys's journey work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a journey override is in its life cycle. */
export type JourneyOverrideStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A journey override as the journey team keeps it. */
export class JourneyOverride {
  code: string;
  name: string;
  category: string;
  source: string;
  amount: number;
  version: number;
  visible: boolean;
  active: boolean;
  status: JourneyOverrideStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    source: string,
    amount: number,
    version: number,
    visible: boolean,
    active: boolean,
    status: JourneyOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.source = source;
    this.amount = amount;
    this.version = version;
    this.visible = visible;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: JourneyOverrideStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: JourneyOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netExposure(): number {
    return Math.round((this.amount - this.version) * 100) / 100;
  }

  copy(): JourneyOverride {
    return new JourneyOverride(
      this.code,
      this.name,
      this.category,
      this.source,
      this.amount,
      this.version,
      this.visible,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a journey override in status proposed. */
export function newJourneyOverride(code: string, name: string): JourneyOverride {
  return new JourneyOverride(code, name, "", "", 0, 0, false, false, "proposed");
}
