/**
 * The weighted window proposal records of attribution's window work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted window proposal is in its life cycle. */
export type WeightedWindowProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One weighted window proposal, with what the planners need to act on it. */
export class WeightedWindowProposal {
  code: string;
  title: string;
  timezone: string;
  cohort: string;
  attempts: number;
  version: number;
  status: WeightedWindowProposalStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    cohort: string,
    attempts: number,
    version: number,
    status: WeightedWindowProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.cohort = cohort;
    this.attempts = attempts;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedWindowProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: WeightedWindowProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted window proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedLoad(): number {
    return Math.round((this.version + this.attempts) * 100) / 100;
  }

  copy(): WeightedWindowProposal {
    return new WeightedWindowProposal(
      this.code,
      this.title,
      this.timezone,
      this.cohort,
      this.attempts,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted window proposal in status idle. */
export function newWeightedWindowProposal(code: string, title: string): WeightedWindowProposal {
  return new WeightedWindowProposal(code, title, "", "", 0, 0, "idle");
}
