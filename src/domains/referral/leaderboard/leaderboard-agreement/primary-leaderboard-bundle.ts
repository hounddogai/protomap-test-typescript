import * as text from "../../../../kit/text.js";

/** Where a primary leaderboard bundle is in its life cycle. */
export type PrimaryLeaderboardBundleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A primary leaderboard bundle as the leaderboard team keeps it. */
export class PrimaryLeaderboardBundle {
  code: string;
  label: string;
  utmSource: string;
  attributes: Map<string, string>;
  notes: string;
  budget: number;
  batchSize: number;
  status: PrimaryLeaderboardBundleStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    attributes: Map<string, string>,
    notes: string,
    budget: number,
    batchSize: number,
    status: PrimaryLeaderboardBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.attributes = attributes;
    this.notes = notes;
    this.budget = budget;
    this.batchSize = batchSize;
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

  canMoveTo(next: PrimaryLeaderboardBundleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PrimaryLeaderboardBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary leaderboard bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"primary leaderboard bundle"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedLoad(): number {
    return Math.round((this.budget + this.batchSize) * 100) / 100;
  }

  copy(): PrimaryLeaderboardBundle {
    return new PrimaryLeaderboardBundle(
      this.code,
      this.label,
      this.utmSource,
      this.attributes,
      this.notes,
      this.budget,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a primary leaderboard bundle in status open. */
export function newPrimaryLeaderboardBundle(code: string, label: string): PrimaryLeaderboardBundle {
  return new PrimaryLeaderboardBundle(code, label, "", new Map<string, string>(), "", 0, 0, "open");
}
