/**
 * The pacing score records of adops's pacing work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pacing score is in its life cycle. */
export type PacingScoreStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One pacing score, with what the planners need to act on it. */
export class PacingScore {
  code: string;
  title: string;
  graceDays: number;
  region: string;
  journeyId: string;
  windowDays: number;
  bid: number;
  campaignRef: string;
  status: PacingScoreStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    region: string,
    journeyId: string,
    windowDays: number,
    bid: number,
    campaignRef: string,
    status: PacingScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.region = region;
    this.journeyId = journeyId;
    this.windowDays = windowDays;
    this.bid = bid;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PacingScoreStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PacingScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedTotal(): number {
    return Math.round((this.bid + this.graceDays) * 100) / 100;
  }

  copy(): PacingScore {
    return new PacingScore(
      this.code,
      this.title,
      this.graceDays,
      this.region,
      this.journeyId,
      this.windowDays,
      this.bid,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a pacing score in status proposed. */
export function newPacingScore(code: string, title: string): PacingScore {
  return new PacingScore(code, title, 0, "", "", 0, 0, "", "proposed");
}
