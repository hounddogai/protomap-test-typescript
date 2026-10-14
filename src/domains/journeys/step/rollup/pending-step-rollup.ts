/**
 * The pending step rollup records of journeys's step work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending step rollup is in its life cycle. */
export type PendingStepRollupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One pending step rollup, with what the planners need to act on it. */
export class PendingStepRollup {
  code: string;
  label: string;
  audienceId: string;
  channel: string;
  budget: number;
  archived: boolean;
  status: PendingStepRollupStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    channel: string,
    budget: number,
    archived: boolean,
    status: PendingStepRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.channel = channel;
    this.budget = budget;
    this.archived = archived;
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

  canMoveTo(next: PendingStepRollupStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PendingStepRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending step rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): PendingStepRollup {
    return new PendingStepRollup(
      this.code,
      this.label,
      this.audienceId,
      this.channel,
      this.budget,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pending step rollup in status open. */
export function newPendingStepRollup(code: string, label: string): PendingStepRollup {
  return new PendingStepRollup(code, label, "", "", 0, false, "open");
}
