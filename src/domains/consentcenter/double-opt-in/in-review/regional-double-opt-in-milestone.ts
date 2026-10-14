import * as text from "../../../../kit/text.js";

/** Where a regional double opt in milestone is in its life cycle. */
export type RegionalDoubleOptInMilestoneStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One regional double opt in milestone, with what the planners need to act on it. */
export class RegionalDoubleOptInMilestone {
  code: string;
  name: string;
  category: string;
  graceDays: number;
  updatedAt: number;
  channel: string;
  cohort: string;
  score: number;
  attempts: number;
  openRate: number;
  status: RegionalDoubleOptInMilestoneStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    graceDays: number,
    updatedAt: number,
    channel: string,
    cohort: string,
    score: number,
    attempts: number,
    openRate: number,
    status: RegionalDoubleOptInMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.graceDays = graceDays;
    this.updatedAt = updatedAt;
    this.channel = channel;
    this.cohort = cohort;
    this.score = score;
    this.attempts = attempts;
    this.openRate = openRate;
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

  canMoveTo(next: RegionalDoubleOptInMilestoneStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RegionalDoubleOptInMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional double opt in milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.score + this.updatedAt) * 100) / 100;
  }

  copy(): RegionalDoubleOptInMilestone {
    return new RegionalDoubleOptInMilestone(
      this.code,
      this.name,
      this.category,
      this.graceDays,
      this.updatedAt,
      this.channel,
      this.cohort,
      this.score,
      this.attempts,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a regional double opt in milestone in status planned. */
export function newRegionalDoubleOptInMilestone(code: string, name: string): RegionalDoubleOptInMilestone {
  return new RegionalDoubleOptInMilestone(code, name, "", 0, 0, "", "", 0, 0, 0, "planned");
}
