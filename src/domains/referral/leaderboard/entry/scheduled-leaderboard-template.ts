import * as text from "../../../../kit/text.js";

/** Where a scheduled leaderboard template is in its life cycle. */
export type ScheduledLeaderboardTemplateStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a scheduled leaderboard template and its current status. */
export class ScheduledLeaderboardTemplate {
  code: string;
  name: string;
  channel: string;
  rate: number;
  category: string;
  approved: boolean;
  status: ScheduledLeaderboardTemplateStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    rate: number,
    category: string,
    approved: boolean,
    status: ScheduledLeaderboardTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.rate = rate;
    this.category = category;
    this.approved = approved;
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

  canMoveTo(next: ScheduledLeaderboardTemplateStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "running":
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

  moveTo(next: ScheduledLeaderboardTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled leaderboard template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled leaderboard template"} ${this.code}`;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): ScheduledLeaderboardTemplate {
    return new ScheduledLeaderboardTemplate(
      this.code,
      this.name,
      this.channel,
      this.rate,
      this.category,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a scheduled leaderboard template in status new. */
export function newScheduledLeaderboardTemplate(code: string, name: string): ScheduledLeaderboardTemplate {
  return new ScheduledLeaderboardTemplate(code, name, "", 0, "", false, "new");
}
