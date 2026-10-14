/**
 * The redemption override records of loyaltyhub's redemption work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a redemption override is in its life cycle. */
export type RedemptionOverrideStatus = "new" | "queued" | "running" | "done" | "failed";

/** One redemption override, with what the planners need to act on it. */
export class RedemptionOverride {
  code: string;
  label: string;
  name: string;
  description: string;
  sendAt: number;
  notes: string;
  version: number;
  openRate: number;
  threshold: number;
  status: RedemptionOverrideStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    description: string,
    sendAt: number,
    notes: string,
    version: number,
    openRate: number,
    threshold: number,
    status: RedemptionOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.description = description;
    this.sendAt = sendAt;
    this.notes = notes;
    this.version = version;
    this.openRate = openRate;
    this.threshold = threshold;
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

  canMoveTo(next: RedemptionOverrideStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RedemptionOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedVolume(): number {
    return Math.round((this.openRate - this.version) * 100) / 100;
  }

  copy(): RedemptionOverride {
    return new RedemptionOverride(
      this.code,
      this.label,
      this.name,
      this.description,
      this.sendAt,
      this.notes,
      this.version,
      this.openRate,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a redemption override in status new. */
export function newRedemptionOverride(code: string, label: string): RedemptionOverride {
  return new RedemptionOverride(code, label, "", "", 0, "", 0, 0, 0, "new");
}
