/**
 * The bid rule baseline records of adops's bid rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bid rule baseline is in its life cycle. */
export type BidRuleBaselineStatus = "new" | "queued" | "running" | "done" | "failed";

/** One bid rule baseline, with what the planners need to act on it. */
export class BidRuleBaseline {
  code: string;
  name: string;
  description: string;
  audienceId: string;
  startsAt: number;
  frequencyCap: number;
  status: BidRuleBaselineStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    audienceId: string,
    startsAt: number,
    frequencyCap: number,
    status: BidRuleBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.audienceId = audienceId;
    this.startsAt = startsAt;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: BidRuleBaselineStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: BidRuleBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.startsAt + this.frequencyCap) * 100) / 100;
  }

  copy(): BidRuleBaseline {
    return new BidRuleBaseline(
      this.code,
      this.name,
      this.description,
      this.audienceId,
      this.startsAt,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a bid rule baseline in status new. */
export function newBidRuleBaseline(code: string, name: string): BidRuleBaseline {
  return new BidRuleBaseline(code, name, "", "", 0, 0, "new");
}
