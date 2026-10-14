import * as text from "../../../../kit/text.js";

/** Where a primary leaderboard allocation is in its life cycle. */
export type PrimaryLeaderboardAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** One primary leaderboard allocation, with what the planners need to act on it. */
export class PrimaryLeaderboardAllocation {
  code: string;
  label: string;
  checksum: string;
  version: number;
  priority: number;
  floorValue: number;
  attributes: Map<string, string>;
  clicks: number;
  name: string;
  status: PrimaryLeaderboardAllocationStatus;

  constructor(
    code: string,
    label: string,
    checksum: string,
    version: number,
    priority: number,
    floorValue: number,
    attributes: Map<string, string>,
    clicks: number,
    name: string,
    status: PrimaryLeaderboardAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.checksum = checksum;
    this.version = version;
    this.priority = priority;
    this.floorValue = floorValue;
    this.attributes = attributes;
    this.clicks = clicks;
    this.name = name;
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

  canMoveTo(next: PrimaryLeaderboardAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryLeaderboardAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary leaderboard allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"primary leaderboard allocation"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedValue(): number {
    return Math.round((this.version + this.clicks) * 100) / 100;
  }

  copy(): PrimaryLeaderboardAllocation {
    return new PrimaryLeaderboardAllocation(
      this.code,
      this.label,
      this.checksum,
      this.version,
      this.priority,
      this.floorValue,
      this.attributes,
      this.clicks,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a primary leaderboard allocation in status new. */
export function newPrimaryLeaderboardAllocation(code: string, label: string): PrimaryLeaderboardAllocation {
  return new PrimaryLeaderboardAllocation(code, label, "", 0, 0, 0, new Map<string, string>(), 0, "", "new");
}
