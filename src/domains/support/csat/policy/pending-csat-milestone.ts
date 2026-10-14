import * as text from "../../../../kit/text.js";

/** Where a pending csat milestone is in its life cycle. */
export type PendingCsatMilestoneStatus = "requested" | "granted" | "revoked" | "expired";

/** A pending csat milestone. Its code is unique within a tenant. */
export class PendingCsatMilestone {
  code: string;
  title: string;
  score: number;
  impressions: number;
  cost: number;
  createdAt: number;
  status: PendingCsatMilestoneStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    impressions: number,
    cost: number,
    createdAt: number,
    status: PendingCsatMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.impressions = impressions;
    this.cost = cost;
    this.createdAt = createdAt;
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

  canMoveTo(next: PendingCsatMilestoneStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingCsatMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending csat milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedExposure(): number {
    return Math.round((this.createdAt - this.score) * 100) / 100;
  }

  copy(): PendingCsatMilestone {
    return new PendingCsatMilestone(
      this.code,
      this.title,
      this.score,
      this.impressions,
      this.cost,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending csat milestone in status requested. */
export function newPendingCsatMilestone(code: string, title: string): PendingCsatMilestone {
  return new PendingCsatMilestone(code, title, 0, 0, 0, 0, "requested");
}
