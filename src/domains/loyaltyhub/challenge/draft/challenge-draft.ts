/**
 * The challenge draft records of loyaltyhub's challenge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a challenge draft is in its life cycle. */
export type ChallengeDraftStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a challenge draft and its current status. */
export class ChallengeDraft {
  code: string;
  label: string;
  updatedAt: number;
  bid: number;
  windowDays: number;
  unit: string;
  campaignRef: string;
  status: ChallengeDraftStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    bid: number,
    windowDays: number,
    unit: string,
    campaignRef: string,
    status: ChallengeDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.bid = bid;
    this.windowDays = windowDays;
    this.unit = unit;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: ChallengeDraftStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "done" || next === "failed";
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

  moveTo(next: ChallengeDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"challenge draft"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.bid + this.windowDays) * 100) / 100;
  }

  copy(): ChallengeDraft {
    return new ChallengeDraft(
      this.code,
      this.label,
      this.updatedAt,
      this.bid,
      this.windowDays,
      this.unit,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a challenge draft in status new. */
export function newChallengeDraft(code: string, label: string): ChallengeDraft {
  return new ChallengeDraft(code, label, 0, 0, 0, "", "", "new");
}
