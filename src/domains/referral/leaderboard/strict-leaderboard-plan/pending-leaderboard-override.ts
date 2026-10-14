import * as text from "../../../../kit/text.js";

/** Where a pending leaderboard override is in its life cycle. */
export type PendingLeaderboardOverrideStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A pending leaderboard override. Its code is unique within a tenant. */
export class PendingLeaderboardOverride {
  code: string;
  label: string;
  archived: boolean;
  conversionRate: number;
  audienceId: string;
  ratio: number;
  durationMinutes: number;
  variant: string;
  status: PendingLeaderboardOverrideStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    conversionRate: number,
    audienceId: string,
    ratio: number,
    durationMinutes: number,
    variant: string,
    status: PendingLeaderboardOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.conversionRate = conversionRate;
    this.audienceId = audienceId;
    this.ratio = ratio;
    this.durationMinutes = durationMinutes;
    this.variant = variant;
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

  canMoveTo(next: PendingLeaderboardOverrideStatus): boolean {
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

  moveTo(next: PendingLeaderboardOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending leaderboard override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedTotal(): number {
    return Math.round((this.conversionRate - this.ratio) * 100) / 100;
  }

  copy(): PendingLeaderboardOverride {
    return new PendingLeaderboardOverride(
      this.code,
      this.label,
      this.archived,
      this.conversionRate,
      this.audienceId,
      this.ratio,
      this.durationMinutes,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending leaderboard override in status planned. */
export function newPendingLeaderboardOverride(code: string, label: string): PendingLeaderboardOverride {
  return new PendingLeaderboardOverride(code, label, false, 0, "", 0, 0, "", "planned");
}
