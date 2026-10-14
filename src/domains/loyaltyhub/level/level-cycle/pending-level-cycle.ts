/**
 * The pending level cycle records of loyaltyhub's level work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending level cycle is in its life cycle. */
export type PendingLevelCycleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One pending level cycle, with what the planners need to act on it. */
export class PendingLevelCycle {
  code: string;
  label: string;
  sequence: number;
  impressions: number;
  audienceId: string;
  status: PendingLevelCycleStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    impressions: number,
    audienceId: string,
    status: PendingLevelCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.impressions = impressions;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingLevelCycleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingLevelCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending level cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedLoad(): number {
    return Math.round(this.sequence * this.impressions * 100) / 100;
  }

  copy(): PendingLevelCycle {
    return new PendingLevelCycle(this.code, this.label, this.sequence, this.impressions, this.audienceId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending level cycle in status open. */
export function newPendingLevelCycle(code: string, label: string): PendingLevelCycle {
  return new PendingLevelCycle(code, label, 0, 0, "", "open");
}
