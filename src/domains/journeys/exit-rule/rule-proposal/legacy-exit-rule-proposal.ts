/**
 * The legacy exit rule proposal records of journeys's exit rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy exit rule proposal is in its life cycle. */
export type LegacyExitRuleProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A legacy exit rule proposal. Its code is unique within a tenant. */
export class LegacyExitRuleProposal {
  code: string;
  title: string;
  limit: number;
  margin: number;
  journeyId: string;
  capacity: number;
  status: LegacyExitRuleProposalStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    margin: number,
    journeyId: string,
    capacity: number,
    status: LegacyExitRuleProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.margin = margin;
    this.journeyId = journeyId;
    this.capacity = capacity;
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

  canMoveTo(next: LegacyExitRuleProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LegacyExitRuleProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy exit rule proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round((this.margin - this.limit) * 100) / 100;
  }

  copy(): LegacyExitRuleProposal {
    return new LegacyExitRuleProposal(
      this.code,
      this.title,
      this.limit,
      this.margin,
      this.journeyId,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy exit rule proposal in status idle. */
export function newLegacyExitRuleProposal(code: string, title: string): LegacyExitRuleProposal {
  return new LegacyExitRuleProposal(code, title, 0, 0, "", 0, "idle");
}
