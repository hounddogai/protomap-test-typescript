import * as text from "../../../../kit/text.js";

/** Where a leaderboard audit is in its life cycle. */
export type LeaderboardAuditStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A leaderboard audit as the leaderboard team keeps it. */
export class LeaderboardAudit {
  code: string;
  title: string;
  cohort: string;
  ratio: number;
  archived: boolean;
  endsAt: number;
  status: LeaderboardAuditStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    ratio: number,
    archived: boolean,
    endsAt: number,
    status: LeaderboardAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.ratio = ratio;
    this.archived = archived;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LeaderboardAuditStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"leaderboard audit"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round(this.endsAt * this.ratio * 100) / 100;
  }

  copy(): LeaderboardAudit {
    return new LeaderboardAudit(
      this.code,
      this.title,
      this.cohort,
      this.ratio,
      this.archived,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a leaderboard audit in status planned. */
export function newLeaderboardAudit(code: string, title: string): LeaderboardAudit {
  return new LeaderboardAudit(code, title, "", 0, false, 0, "planned");
}
