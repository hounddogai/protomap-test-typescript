import * as text from "../../../../kit/text.js";

/** Where a leaderboard assignment is in its life cycle. */
export type LeaderboardAssignmentStatus = "created" | "validated" | "published" | "retired";

/** A leaderboard assignment. Its code is unique within a tenant. */
export class LeaderboardAssignment {
  code: string;
  label: string;
  rate: number;
  frequencyCap: number;
  title: string;
  status: LeaderboardAssignmentStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    frequencyCap: number,
    title: string,
    status: LeaderboardAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.frequencyCap = frequencyCap;
    this.title = title;
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

  canMoveTo(next: LeaderboardAssignmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"leaderboard assignment"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.rate + this.frequencyCap) * 100) / 100;
  }

  copy(): LeaderboardAssignment {
    return new LeaderboardAssignment(this.code, this.label, this.rate, this.frequencyCap, this.title, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a leaderboard assignment in status created. */
export function newLeaderboardAssignment(code: string, label: string): LeaderboardAssignment {
  return new LeaderboardAssignment(code, label, 0, 0, "", "created");
}
