import * as text from "../../../../kit/text.js";

/** Where a leaderboard proposal is in its life cycle. */
export type LeaderboardProposalStatus = "created" | "validated" | "published" | "retired";

/** The record of a leaderboard proposal and its current status. */
export class LeaderboardProposal {
  code: string;
  label: string;
  score: number;
  version: number;
  ownerId: string;
  retries: number;
  utmSource: string;
  status: LeaderboardProposalStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    version: number,
    ownerId: string,
    retries: number,
    utmSource: string,
    status: LeaderboardProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.version = version;
    this.ownerId = ownerId;
    this.retries = retries;
    this.utmSource = utmSource;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LeaderboardProposalStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"leaderboard proposal"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.score + this.version) * 100) / 100;
  }

  copy(): LeaderboardProposal {
    return new LeaderboardProposal(
      this.code,
      this.label,
      this.score,
      this.version,
      this.ownerId,
      this.retries,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a leaderboard proposal in status created. */
export function newLeaderboardProposal(code: string, label: string): LeaderboardProposal {
  return new LeaderboardProposal(code, label, 0, 0, "", 0, "", "created");
}
