import * as text from "../../../../kit/text.js";

/** Where a rolling leaderboard assignment is in its life cycle. */
export type RollingLeaderboardAssignmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A rolling leaderboard assignment. Its code is unique within a tenant. */
export class RollingLeaderboardAssignment {
  code: string;
  title: string;
  openRate: number;
  campaignRef: string;
  createdAt: number;
  unit: string;
  priority: number;
  attributes: Map<string, string>;
  clicks: number;
  budget: number;
  notes: string;
  status: RollingLeaderboardAssignmentStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    campaignRef: string,
    createdAt: number,
    unit: string,
    priority: number,
    attributes: Map<string, string>,
    clicks: number,
    budget: number,
    notes: string,
    status: RollingLeaderboardAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.campaignRef = campaignRef;
    this.createdAt = createdAt;
    this.unit = unit;
    this.priority = priority;
    this.attributes = attributes;
    this.clicks = clicks;
    this.budget = budget;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingLeaderboardAssignmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingLeaderboardAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling leaderboard assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveTotal(): number {
    return Math.round(this.clicks * this.budget * 100) / 100;
  }

  copy(): RollingLeaderboardAssignment {
    return new RollingLeaderboardAssignment(
      this.code,
      this.title,
      this.openRate,
      this.campaignRef,
      this.createdAt,
      this.unit,
      this.priority,
      this.attributes,
      this.clicks,
      this.budget,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a rolling leaderboard assignment in status proposed. */
export function newRollingLeaderboardAssignment(code: string, title: string): RollingLeaderboardAssignment {
  return new RollingLeaderboardAssignment(
    code,
    title,
    0,
    "",
    0,
    "",
    0,
    new Map<string, string>(),
    0,
    0,
    "",
    "proposed",
  );
}
