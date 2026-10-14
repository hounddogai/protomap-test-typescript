/**
 * The exit rule snapshot records of journeys's exit rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a exit rule snapshot is in its life cycle. */
export type ExitRuleSnapshotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A exit rule snapshot. Its code is unique within a tenant. */
export class ExitRuleSnapshot {
  code: string;
  name: string;
  maximum: number;
  cost: number;
  checksum: string;
  margin: number;
  status: ExitRuleSnapshotStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    cost: number,
    checksum: string,
    margin: number,
    status: ExitRuleSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.cost = cost;
    this.checksum = checksum;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ExitRuleSnapshotStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ExitRuleSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"exit rule snapshot"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.maximum * this.cost * 100) / 100;
  }

  copy(): ExitRuleSnapshot {
    return new ExitRuleSnapshot(this.code, this.name, this.maximum, this.cost, this.checksum, this.margin, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a exit rule snapshot in status planned. */
export function newExitRuleSnapshot(code: string, name: string): ExitRuleSnapshot {
  return new ExitRuleSnapshot(code, name, 0, 0, "", 0, "planned");
}
