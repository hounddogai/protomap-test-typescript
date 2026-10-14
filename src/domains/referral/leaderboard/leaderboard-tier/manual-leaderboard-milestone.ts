import * as text from "../../../../kit/text.js";

/** Where a manual leaderboard milestone is in its life cycle. */
export type ManualLeaderboardMilestoneStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A manual leaderboard milestone as the leaderboard team keeps it. */
export class ManualLeaderboardMilestone {
  code: string;
  name: string;
  audienceId: string;
  tags: string[];
  attempts: number;
  priority: number;
  description: string;
  floorValue: number;
  status: ManualLeaderboardMilestoneStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    tags: string[],
    attempts: number,
    priority: number,
    description: string,
    floorValue: number,
    status: ManualLeaderboardMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.tags = tags;
    this.attempts = attempts;
    this.priority = priority;
    this.description = description;
    this.floorValue = floorValue;
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

  canMoveTo(next: ManualLeaderboardMilestoneStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
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

  moveTo(next: ManualLeaderboardMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual leaderboard milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round((this.attempts + this.floorValue) * 100) / 100;
  }

  copy(): ManualLeaderboardMilestone {
    return new ManualLeaderboardMilestone(
      this.code,
      this.name,
      this.audienceId,
      this.tags,
      this.attempts,
      this.priority,
      this.description,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a manual leaderboard milestone in status open. */
export function newManualLeaderboardMilestone(code: string, name: string): ManualLeaderboardMilestone {
  return new ManualLeaderboardMilestone(code, name, "", [], 0, 0, "", 0, "open");
}
