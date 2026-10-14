/**
 * The pending exit rule preference records of journeys's exit rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending exit rule preference is in its life cycle. */
export type PendingExitRulePreferenceStatus = "new" | "queued" | "running" | "done" | "failed";

/** A pending exit rule preference as the exit rule team keeps it. */
export class PendingExitRulePreference {
  code: string;
  name: string;
  priority: number;
  quantity: number;
  minimum: number;
  approved: boolean;
  region: string;
  utmSource: string;
  version: number;
  discount: number;
  status: PendingExitRulePreferenceStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    quantity: number,
    minimum: number,
    approved: boolean,
    region: string,
    utmSource: string,
    version: number,
    discount: number,
    status: PendingExitRulePreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.quantity = quantity;
    this.minimum = minimum;
    this.approved = approved;
    this.region = region;
    this.utmSource = utmSource;
    this.version = version;
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

  canMoveTo(next: PendingExitRulePreferenceStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingExitRulePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending exit rule preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round((this.quantity - this.discount) * 100) / 100;
  }

  copy(): PendingExitRulePreference {
    return new PendingExitRulePreference(
      this.code,
      this.name,
      this.priority,
      this.quantity,
      this.minimum,
      this.approved,
      this.region,
      this.utmSource,
      this.version,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a pending exit rule preference in status new. */
export function newPendingExitRulePreference(code: string, name: string): PendingExitRulePreference {
  return new PendingExitRulePreference(code, name, 0, 0, 0, false, "", "", 0, 0, "new");
}
