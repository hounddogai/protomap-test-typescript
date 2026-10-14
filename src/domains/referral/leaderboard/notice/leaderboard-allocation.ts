import * as text from "../../../../kit/text.js";

/** Where a leaderboard allocation is in its life cycle. */
export type LeaderboardAllocationStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A leaderboard allocation as the leaderboard team keeps it. */
export class LeaderboardAllocation {
  code: string;
  name: string;
  category: string;
  version: number;
  endsAt: number;
  label: string;
  floorValue: number;
  expiresAt: number;
  ratio: number;
  title: string;
  batchSize: number;
  status: LeaderboardAllocationStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    version: number,
    endsAt: number,
    label: string,
    floorValue: number,
    expiresAt: number,
    ratio: number,
    title: string,
    batchSize: number,
    status: LeaderboardAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.version = version;
    this.endsAt = endsAt;
    this.label = label;
    this.floorValue = floorValue;
    this.expiresAt = expiresAt;
    this.ratio = ratio;
    this.title = title;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LeaderboardAllocationStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LeaderboardAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"leaderboard allocation"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.expiresAt - this.version) * 100) / 100;
  }

  copy(): LeaderboardAllocation {
    return new LeaderboardAllocation(
      this.code,
      this.name,
      this.category,
      this.version,
      this.endsAt,
      this.label,
      this.floorValue,
      this.expiresAt,
      this.ratio,
      this.title,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a leaderboard allocation in status draft. */
export function newLeaderboardAllocation(code: string, name: string): LeaderboardAllocation {
  return new LeaderboardAllocation(code, name, "", 0, 0, "", 0, 0, 0, "", 0, "draft");
}
