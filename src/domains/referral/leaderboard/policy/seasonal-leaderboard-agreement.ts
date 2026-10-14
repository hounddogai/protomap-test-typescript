import * as text from "../../../../kit/text.js";

/** Where a seasonal leaderboard agreement is in its life cycle. */
export type SeasonalLeaderboardAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One seasonal leaderboard agreement, with what the planners need to act on it. */
export class SeasonalLeaderboardAgreement {
  code: string;
  name: string;
  maximum: number;
  cohort: string;
  bid: number;
  sendAt: number;
  active: boolean;
  batchSize: number;
  status: SeasonalLeaderboardAgreementStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    cohort: string,
    bid: number,
    sendAt: number,
    active: boolean,
    batchSize: number,
    status: SeasonalLeaderboardAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.cohort = cohort;
    this.bid = bid;
    this.sendAt = sendAt;
    this.active = active;
    this.batchSize = batchSize;
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

  canMoveTo(next: SeasonalLeaderboardAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: SeasonalLeaderboardAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal leaderboard agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveExposure(): number {
    return Math.round(this.sendAt * this.maximum * 100) / 100;
  }

  copy(): SeasonalLeaderboardAgreement {
    return new SeasonalLeaderboardAgreement(
      this.code,
      this.name,
      this.maximum,
      this.cohort,
      this.bid,
      this.sendAt,
      this.active,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal leaderboard agreement in status open. */
export function newSeasonalLeaderboardAgreement(code: string, name: string): SeasonalLeaderboardAgreement {
  return new SeasonalLeaderboardAgreement(code, name, 0, "", 0, 0, false, 0, "open");
}
