import * as text from "../../../../kit/text.js";

/** Where a rolling pacing score is in its life cycle. */
export type RollingPacingScoreStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A rolling pacing score as the pacing team keeps it. */
export class RollingPacingScore {
  code: string;
  name: string;
  clicks: number;
  approved: boolean;
  active: boolean;
  attempts: number;
  timezone: string;
  description: string;
  impressions: number;
  audienceId: string;
  limit: number;
  status: RollingPacingScoreStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    approved: boolean,
    active: boolean,
    attempts: number,
    timezone: string,
    description: string,
    impressions: number,
    audienceId: string,
    limit: number,
    status: RollingPacingScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.approved = approved;
    this.active = active;
    this.attempts = attempts;
    this.timezone = timezone;
    this.description = description;
    this.impressions = impressions;
    this.audienceId = audienceId;
    this.limit = limit;
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

  canMoveTo(next: RollingPacingScoreStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingPacingScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling pacing score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round(this.attempts * this.impressions * 100) / 100;
  }

  copy(): RollingPacingScore {
    return new RollingPacingScore(
      this.code,
      this.name,
      this.clicks,
      this.approved,
      this.active,
      this.attempts,
      this.timezone,
      this.description,
      this.impressions,
      this.audienceId,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling pacing score in status planned. */
export function newRollingPacingScore(code: string, name: string): RollingPacingScore {
  return new RollingPacingScore(code, name, 0, false, false, 0, "", "", 0, "", 0, "planned");
}
