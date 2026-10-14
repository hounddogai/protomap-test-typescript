/**
 * The global branch assignment records of journeys's branch work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global branch assignment is in its life cycle. */
export type GlobalBranchAssignmentStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a global branch assignment and its current status. */
export class GlobalBranchAssignment {
  code: string;
  name: string;
  audienceId: string;
  unit: string;
  priority: number;
  impressions: number;
  status: GlobalBranchAssignmentStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    unit: string,
    priority: number,
    impressions: number,
    status: GlobalBranchAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.unit = unit;
    this.priority = priority;
    this.impressions = impressions;
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

  canMoveTo(next: GlobalBranchAssignmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: GlobalBranchAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global branch assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netTotal(): number {
    return Math.round((this.priority - this.impressions) * 100) / 100;
  }

  copy(): GlobalBranchAssignment {
    return new GlobalBranchAssignment(
      this.code,
      this.name,
      this.audienceId,
      this.unit,
      this.priority,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a global branch assignment in status requested. */
export function newGlobalBranchAssignment(code: string, name: string): GlobalBranchAssignment {
  return new GlobalBranchAssignment(code, name, "", "", 0, 0, "requested");
}
