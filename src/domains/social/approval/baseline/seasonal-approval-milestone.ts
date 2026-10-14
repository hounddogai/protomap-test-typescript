import * as text from "../../../../kit/text.js";

/** Where a seasonal approval milestone is in its life cycle. */
export type SeasonalApprovalMilestoneStatus = "requested" | "granted" | "revoked" | "expired";

/** A seasonal approval milestone as the approval team keeps it. */
export class SeasonalApprovalMilestone {
  code: string;
  title: string;
  ceiling: number;
  reviewer: string;
  windowDays: number;
  impressions: number;
  score: number;
  attempts: number;
  cost: number;
  updatedAt: number;
  status: SeasonalApprovalMilestoneStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    reviewer: string,
    windowDays: number,
    impressions: number,
    score: number,
    attempts: number,
    cost: number,
    updatedAt: number,
    status: SeasonalApprovalMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.reviewer = reviewer;
    this.windowDays = windowDays;
    this.impressions = impressions;
    this.score = score;
    this.attempts = attempts;
    this.cost = cost;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalApprovalMilestoneStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: SeasonalApprovalMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal approval milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round((this.impressions + this.attempts) * 100) / 100;
  }

  copy(): SeasonalApprovalMilestone {
    return new SeasonalApprovalMilestone(
      this.code,
      this.title,
      this.ceiling,
      this.reviewer,
      this.windowDays,
      this.impressions,
      this.score,
      this.attempts,
      this.cost,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal approval milestone in status requested. */
export function newSeasonalApprovalMilestone(code: string, title: string): SeasonalApprovalMilestone {
  return new SeasonalApprovalMilestone(code, title, 0, "", 0, 0, 0, 0, 0, 0, "requested");
}
